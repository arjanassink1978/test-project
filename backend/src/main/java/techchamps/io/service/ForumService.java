package techchamps.io.service;

import techchamps.io.dto.request.CreateReplyRequest;
import techchamps.io.dto.request.CreateThreadRequest;
import techchamps.io.dto.response.*;
import techchamps.io.model.*;
import techchamps.io.repository.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ForumService {

    // CONSTRAINT: page size 20 — must match frontend
    private static final int PAGE_SIZE = 20;

    // CONSTRAINT: score < -5 hidden — must match frontend
    private static final int HIDDEN_SCORE_THRESHOLD = -5;

    // CONSTRAINT: max reply depth 3 levels (0,1,2) — backend rejects depth >= 3
    private static final int MAX_REPLY_DEPTH = 3;

    private final ForumCategoryRepository categoryRepository;
    private final ForumThreadRepository threadRepository;
    private final ForumReplyRepository replyRepository;
    private final ForumVoteRepository voteRepository;
    private final AppUserRepository userRepository;

    public ForumService(ForumCategoryRepository categoryRepository,
                        ForumThreadRepository threadRepository,
                        ForumReplyRepository replyRepository,
                        ForumVoteRepository voteRepository,
                        AppUserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.threadRepository = threadRepository;
        this.replyRepository = replyRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
    }

    public List<ForumCategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(c -> new ForumCategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getIcon()))
                .collect(Collectors.toList());
    }

    public PagedThreadsResponse getThreads(Long categoryId, String sort, int page, String search) {
        Sort sortSpec = buildSort(sort);
        Pageable pageable = PageRequest.of(page, PAGE_SIZE, sortSpec);

        Page<ForumThread> threadPage;

        if (search != null && !search.isBlank()) {
            threadPage = threadRepository
                    .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search, search, pageable);
        } else if (categoryId != null) {
            threadPage = threadRepository.findByCategoryId(categoryId, pageable);
        } else {
            threadPage = threadRepository.findAll(pageable);
        }

        List<ForumThreadResponse> responses = threadPage.getContent().stream()
                .map(this::toThreadResponse)
                .collect(Collectors.toList());

        return new PagedThreadsResponse(
                responses,
                page,
                PAGE_SIZE,
                threadPage.hasNext()
        );
    }

    public ForumThreadDetailResponse getThread(Long id) {
        ForumThread thread = threadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        ForumThreadDetailResponse response = new ForumThreadDetailResponse();
        copyThreadFields(thread, response);

        List<ForumReply> rootReplies = replyRepository.findByThreadIdAndParentReplyIsNull(id);
        List<ForumReplyResponse> replyTree = rootReplies.stream()
                .map(r -> buildReplyTree(r, 0))
                .collect(Collectors.toList());
        response.setReplies(replyTree);

        return response;
    }

    public ForumThreadResponse createThread(String username, CreateThreadRequest request) {
        AppUser author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        ForumThread thread = new ForumThread();
        thread.setAuthor(author);
        thread.setTitle(request.getTitle());
        thread.setDescription(request.getDescription());

        if (request.getCategoryId() != null) {
            ForumCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
            thread.setCategory(category);
        }

        ForumThread saved = threadRepository.save(thread);
        return toThreadResponse(saved);
    }

    public ForumReplyResponse createReply(Long threadId, String username, CreateReplyRequest request) {
        AppUser author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        ForumThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        int depth = 0;
        ForumReply parentReply = null;

        if (request.getParentReplyId() != null) {
            parentReply = replyRepository.findById(request.getParentReplyId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent reply not found"));
            depth = parentReply.getDepth() + 1;
        }

        // CONSTRAINT: max reply depth 3 levels — reject if depth would exceed max
        if (depth >= MAX_REPLY_DEPTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Maximum reply nesting depth of " + MAX_REPLY_DEPTH + " levels exceeded");
        }

        ForumReply reply = new ForumReply();
        reply.setThread(thread);
        reply.setParentReply(parentReply);
        reply.setAuthor(author);
        reply.setContent(request.getContent());
        reply.setDepth(depth);

        ForumReply saved = replyRepository.save(reply);
        return toReplyResponse(saved, new ArrayList<>());
    }

    public VoteResponse vote(Long postId, String postType, String username, int voteValue) {
        AppUser voter = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Optional<ForumVote> existingVote = voteRepository
                .findByVoterUsernameAndPostIdAndPostType(username, postId, postType);

        int oldVoteValue = 0;
        ForumVote vote;

        if (existingVote.isPresent()) {
            vote = existingVote.get();
            oldVoteValue = vote.getVoteValue();
            vote.setVoteValue(voteValue);
        } else {
            vote = new ForumVote(voter, postId, postType, voteValue);
        }
        voteRepository.save(vote);

        int newScore;
        if ("thread".equals(postType)) {
            ForumThread thread = threadRepository.findById(postId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));
            thread.setScore(thread.getScore() - oldVoteValue + voteValue);
            threadRepository.save(thread);
            newScore = thread.getScore();
        } else if ("reply".equals(postType)) {
            ForumReply reply = replyRepository.findById(postId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reply not found"));
            reply.setScore(reply.getScore() - oldVoteValue + voteValue);
            replyRepository.save(reply);
            newScore = reply.getScore();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid post type: must be 'thread' or 'reply'");
        }

        return new VoteResponse(postId, postType, newScore, voteValue);
    }

    public void deleteThread(Long id, String username) {
        ForumThread thread = threadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isOwner = thread.getAuthor().getUsername().equals(username);
        boolean isAdmin = "ADMIN".equals(user.getRole());

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own threads");
        }

        threadRepository.delete(thread);
    }

    // ---- helpers ----

    private Sort buildSort(String sort) {
        if ("popular".equals(sort)) {
            return Sort.by(Sort.Direction.DESC, "score");
        }
        // newest (default)
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    private ForumReplyResponse buildReplyTree(ForumReply reply, int currentDepth) {
        List<ForumReply> children = replyRepository.findByParentReplyId(reply.getId());
        List<ForumReplyResponse> childResponses;

        if (currentDepth < MAX_REPLY_DEPTH - 1) {
            childResponses = children.stream()
                    .map(c -> buildReplyTree(c, currentDepth + 1))
                    .collect(Collectors.toList());
        } else {
            childResponses = new ArrayList<>();
        }

        return toReplyResponse(reply, childResponses);
    }

    private ForumThreadResponse toThreadResponse(ForumThread thread) {
        ForumThreadResponse r = new ForumThreadResponse();
        copyThreadFields(thread, r);
        return r;
    }

    private void copyThreadFields(ForumThread thread, ForumThreadResponse r) {
        r.setId(thread.getId());
        r.setTitle(thread.getTitle());
        r.setDescription(thread.getDescription());
        r.setScore(thread.getScore());
        r.setCreatedAt(thread.getCreatedAt());
        r.setUpdatedAt(thread.getUpdatedAt());
        r.setAuthorUsername(thread.getAuthor().getUsername());
        if (thread.getCategory() != null) {
            r.setCategoryId(thread.getCategory().getId());
            r.setCategoryName(thread.getCategory().getName());
        }
        r.setReplyCount((int) threadRepository.countRepliesByThreadId(thread.getId()));
    }

    private ForumReplyResponse toReplyResponse(ForumReply reply, List<ForumReplyResponse> children) {
        ForumReplyResponse r = new ForumReplyResponse();
        r.setId(reply.getId());
        r.setContent(reply.getContent());
        r.setScore(reply.getScore());
        r.setCreatedAt(reply.getCreatedAt());
        r.setAuthorUsername(reply.getAuthor().getUsername());
        r.setDepth(reply.getDepth());
        r.setParentReplyId(reply.getParentReply() != null ? reply.getParentReply().getId() : null);
        r.setReplies(children);
        return r;
    }

    public ForumReply getReplyById(Long id) {
        return replyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reply not found"));
    }

}
