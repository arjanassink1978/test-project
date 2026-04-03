package techchamps.io.service;

import techchamps.io.dto.request.CreateReplyRequest;
import techchamps.io.dto.request.CreateThreadRequest;
import techchamps.io.dto.response.*;
import techchamps.io.model.*;
import techchamps.io.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ForumServiceTest {

    @Mock
    private ForumCategoryRepository categoryRepository;

    @Mock
    private ForumThreadRepository threadRepository;

    @Mock
    private ForumReplyRepository replyRepository;

    @Mock
    private ForumVoteRepository voteRepository;

    @Mock
    private AppUserRepository userRepository;

    @InjectMocks
    private ForumService forumService;

    // ============================================================
    // getAllCategories
    // ============================================================

    @Test
    void getAllCategories_returnsAllCategories() {
        ForumCategory cat1 = createCategory(1L, "General", "General discussions", "icon1");
        ForumCategory cat2 = createCategory(2L, "Tech", "Tech discussions", "icon2");
        when(categoryRepository.findAll()).thenReturn(List.of(cat1, cat2));

        List<ForumCategoryResponse> result = forumService.getAllCategories();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(0).getName()).isEqualTo("General");
        assertThat(result.get(0).getDescription()).isEqualTo("General discussions");
        assertThat(result.get(0).getIcon()).isEqualTo("icon1");
        assertThat(result.get(1).getId()).isEqualTo(2L);
        assertThat(result.get(1).getName()).isEqualTo("Tech");
    }

    @Test
    void getAllCategories_whenEmpty_returnsEmptyList() {
        when(categoryRepository.findAll()).thenReturn(Collections.emptyList());

        List<ForumCategoryResponse> result = forumService.getAllCategories();

        assertThat(result).isEmpty();
    }

    // ============================================================
    // getThreads — search, category filter, default
    // ============================================================

    @Test
    void getThreads_withSearch_usesSearchQuery() {
        ForumThread thread = createThread(1L, "Test title", "Desc");
        Page<ForumThread> page = new PageImpl<>(List.of(thread));
        when(threadRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                eq("keyword"), eq("keyword"), any(Pageable.class))).thenReturn(page);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 0, "keyword");

        assertThat(result.getThreads()).hasSize(1);
        assertThat(result.getThreads().get(0).getTitle()).isEqualTo("Test title");
        assertThat(result.getPage()).isEqualTo(0);
        assertThat(result.getSize()).isEqualTo(20);
        verify(threadRepository).findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                eq("keyword"), eq("keyword"), any(Pageable.class));
    }

    @Test
    void getThreads_withBlankSearch_doesNotUseSearchQuery() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        forumService.getThreads(null, "newest", 0, "   ");

        verify(threadRepository, never())
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(any(), any(), any());
        verify(threadRepository).findAll(any(Pageable.class));
    }

    @Test
    void getThreads_withNullSearch_doesNotUseSearchQuery() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        forumService.getThreads(null, "newest", 0, null);

        verify(threadRepository, never())
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(any(), any(), any());
    }

    @Test
    void getThreads_withCategoryId_filtersByCategory() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findByCategoryId(eq(5L), any(Pageable.class))).thenReturn(page);

        forumService.getThreads(5L, "newest", 0, null);

        verify(threadRepository).findByCategoryId(eq(5L), any(Pageable.class));
        verify(threadRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void getThreads_withoutCategoryOrSearch_returnsAll() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        forumService.getThreads(null, "newest", 0, null);

        verify(threadRepository).findAll(any(Pageable.class));
    }

    @Test
    void getThreads_withPopularSort_sortsByScoreDesc() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        forumService.getThreads(null, "popular", 0, null);

        verify(threadRepository).findAll(argThat((Pageable p) ->
                p.getSort().getOrderFor("score") != null
                && p.getSort().getOrderFor("score").getDirection() == Sort.Direction.DESC));
    }

    @Test
    void getThreads_withNewestSort_sortsByCreatedAtDesc() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        forumService.getThreads(null, "newest", 0, null);

        verify(threadRepository).findAll(argThat((Pageable p) ->
                p.getSort().getOrderFor("createdAt") != null
                && p.getSort().getOrderFor("createdAt").getDirection() == Sort.Direction.DESC));
    }

    @Test
    void getThreads_withUnknownSort_defaultsToNewest() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        forumService.getThreads(null, "unknown_sort", 0, null);

        verify(threadRepository).findAll(argThat((Pageable p) ->
                p.getSort().getOrderFor("createdAt") != null));
    }

    @Test
    void getThreads_hasMore_returnsTrueWhenMorePagesExist() {
        ForumThread thread = createThread(1L, "Thread", "Desc");
        Page<ForumThread> page = new PageImpl<>(List.of(thread),
                PageRequest.of(0, 20), 25);
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 0, null);

        assertThat(result.isHasMore()).isTrue();
    }

    @Test
    void getThreads_hasMore_returnsFalseWhenNoMorePages() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList(),
                PageRequest.of(0, 20), 0);
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 0, null);

        assertThat(result.isHasMore()).isFalse();
    }

    @Test
    void getThreads_threadWithCategory_mapsCategoryFields() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumCategory cat = createCategory(10L, "Tech", "Tech desc", "laptop");
        thread.setCategory(cat);
        Page<ForumThread> page = new PageImpl<>(List.of(thread));
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(3L);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 0, null);

        ForumThreadResponse resp = result.getThreads().get(0);
        assertThat(resp.getCategoryId()).isEqualTo(10L);
        assertThat(resp.getCategoryName()).isEqualTo("Tech");
        assertThat(resp.getReplyCount()).isEqualTo(3);
    }

    @Test
    void getThreads_threadWithoutCategory_categoryFieldsAreNull() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        // no category set
        Page<ForumThread> page = new PageImpl<>(List.of(thread));
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 0, null);

        ForumThreadResponse resp = result.getThreads().get(0);
        assertThat(resp.getCategoryId()).isNull();
        assertThat(resp.getCategoryName()).isNull();
    }

    @Test
    void getThreads_mapsAllThreadFields() {
        ForumThread thread = createThread(1L, "Title", "Description");
        thread.setScore(5);
        thread.setCreatedAt(LocalDateTime.of(2026, 1, 1, 12, 0));
        thread.setUpdatedAt(LocalDateTime.of(2026, 1, 2, 12, 0));
        Page<ForumThread> page = new PageImpl<>(List.of(thread));
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 0, null);

        ForumThreadResponse resp = result.getThreads().get(0);
        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getTitle()).isEqualTo("Title");
        assertThat(resp.getDescription()).isEqualTo("Description");
        assertThat(resp.getScore()).isEqualTo(5);
        assertThat(resp.getAuthorUsername()).isEqualTo("testuser");
        assertThat(resp.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 12, 0));
        assertThat(resp.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 1, 2, 12, 0));
    }

    // ============================================================
    // getThread — detail with reply tree
    // ============================================================

    @Test
    void getThread_whenFound_returnsDetailWithReplies() {
        ForumThread thread = createThread(1L, "Thread title", "Thread desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(2L);

        ForumReply rootReply = createReply(10L, thread, null, "Root reply", 0);
        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(rootReply));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        assertThat(result.getTitle()).isEqualTo("Thread title");
        assertThat(result.getDescription()).isEqualTo("Thread desc");
        assertThat(result.getReplyCount()).isEqualTo(2);
        assertThat(result.getReplies()).hasSize(1);
        assertThat(result.getReplies().get(0).getContent()).isEqualTo("Root reply");
        assertThat(result.getReplies().get(0).getReplies()).isEmpty();
    }

    @Test
    void getThread_whenNotFound_throws404() {
        when(threadRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.getThread(999L))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(404);
    }

    @Test
    void getThread_withNoReplies_returnsEmptyReplyList() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);
        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        assertThat(result.getReplies()).isNotNull().isEmpty();
    }

    // ============================================================
    // buildReplyTree — nested replies and depth boundary
    // ============================================================

    @Test
    void getThread_buildReplyTree_nestedTwoLevels() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumReply root = createReply(10L, thread, null, "Root", 0);
        ForumReply child = createReply(20L, thread, root, "Child", 1);

        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(root));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(List.of(child));
        when(replyRepository.findByParentReplyId(20L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        assertThat(result.getReplies()).hasSize(1);
        ForumReplyResponse rootResp = result.getReplies().get(0);
        assertThat(rootResp.getContent()).isEqualTo("Root");
        assertThat(rootResp.getReplies()).hasSize(1);
        assertThat(rootResp.getReplies().get(0).getContent()).isEqualTo("Child");
        assertThat(rootResp.getReplies().get(0).getReplies()).isEmpty();
    }

    @Test
    void getThread_buildReplyTree_stopsAtMaxDepthBoundary() {
        // MAX_REPLY_DEPTH = 3, so at currentDepth=2 (MAX-1), children should be empty
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumReply root = createReply(10L, thread, null, "Root", 0);
        ForumReply depth1 = createReply(20L, thread, root, "Depth1", 1);
        ForumReply depth2 = createReply(30L, thread, depth1, "Depth2", 2);

        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(root));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(List.of(depth1));
        when(replyRepository.findByParentReplyId(20L)).thenReturn(List.of(depth2));
        // at currentDepth=2 (MAX_REPLY_DEPTH-1), should NOT recurse further, so findByParentReplyId(30L) never called

        ForumThreadDetailResponse result = forumService.getThread(1L);

        ForumReplyResponse rootResp = result.getReplies().get(0);
        ForumReplyResponse d1 = rootResp.getReplies().get(0);
        assertThat(d1.getContent()).isEqualTo("Depth1");
        // depth2 exists in children list from the DB query, but its own children are NOT fetched
        assertThat(d1.getReplies()).hasSize(1);
        ForumReplyResponse d2 = d1.getReplies().get(0);
        assertThat(d2.getContent()).isEqualTo("Depth2");
        assertThat(d2.getReplies()).isEmpty();

        // The repository is called for depth2's parent (30L) to get children,
        // but those children are NOT recursed into
        verify(replyRepository).findByParentReplyId(30L);
    }

    @Test
    void getThread_buildReplyTree_multipleRootReplies() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumReply root1 = createReply(10L, thread, null, "Root1", 0);
        ForumReply root2 = createReply(11L, thread, null, "Root2", 0);

        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(root1, root2));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(Collections.emptyList());
        when(replyRepository.findByParentReplyId(11L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        assertThat(result.getReplies()).hasSize(2);
        assertThat(result.getReplies().get(0).getContent()).isEqualTo("Root1");
        assertThat(result.getReplies().get(1).getContent()).isEqualTo("Root2");
    }

    @Test
    void getThread_replyMapsParentReplyId() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumReply root = createReply(10L, thread, null, "Root", 0);
        ForumReply child = createReply(20L, thread, root, "Child", 1);

        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(root));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(List.of(child));
        when(replyRepository.findByParentReplyId(20L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        ForumReplyResponse rootResp = result.getReplies().get(0);
        assertThat(rootResp.getParentReplyId()).isNull();
        assertThat(rootResp.getReplies().get(0).getParentReplyId()).isEqualTo(10L);
    }

    @Test
    void getThread_replyMapsAllFields() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumReply root = createReply(10L, thread, null, "Root content", 0);
        root.setScore(7);
        root.setCreatedAt(LocalDateTime.of(2026, 3, 15, 10, 30));

        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(root));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        ForumReplyResponse replyResp = result.getReplies().get(0);
        assertThat(replyResp.getId()).isEqualTo(10L);
        assertThat(replyResp.getContent()).isEqualTo("Root content");
        assertThat(replyResp.getScore()).isEqualTo(7);
        assertThat(replyResp.getDepth()).isEqualTo(0);
        assertThat(replyResp.getAuthorUsername()).isEqualTo("testuser");
        assertThat(replyResp.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 3, 15, 10, 30));
    }

    // ============================================================
    // createThread
    // ============================================================

    @Test
    void createThread_happyPath_returnsThreadResponse() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumThread saved = createThread(1L, "New thread", "New desc");
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("New thread", "New desc", null);
        ForumThreadResponse result = forumService.createThread("testuser", request);

        assertThat(result.getTitle()).isEqualTo("New thread");
        assertThat(result.getDescription()).isEqualTo("New desc");
        verify(threadRepository).save(any(ForumThread.class));
    }

    @Test
    void createThread_withCategoryId_setsCategory() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumCategory cat = createCategory(5L, "Tech", "Tech", "icon");
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(cat));

        ForumThread saved = createThread(1L, "Thread", "Desc");
        saved.setCategory(cat);
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("Thread", "Desc", 5L);
        ForumThreadResponse result = forumService.createThread("testuser", request);

        assertThat(result.getCategoryId()).isEqualTo(5L);
        assertThat(result.getCategoryName()).isEqualTo("Tech");
    }

    @Test
    void createThread_withInvalidCategoryId_throws404() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        CreateThreadRequest request = new CreateThreadRequest("Thread", "Desc", 999L);

        assertThatThrownBy(() -> forumService.createThread("testuser", request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Category not found");
    }

    @Test
    void createThread_withUnknownUser_throws404() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        CreateThreadRequest request = new CreateThreadRequest("Thread", "Desc", null);

        assertThatThrownBy(() -> forumService.createThread("unknown", request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createThread_withNullCategoryId_doesNotLookupCategory() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumThread saved = createThread(1L, "Thread", "Desc");
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("Thread", "Desc", null);
        forumService.createThread("testuser", request);

        verify(categoryRepository, never()).findById(anyLong());
    }

    // ============================================================
    // createReply
    // ============================================================

    @Test
    void createReply_directReply_setsDepthZero() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));

        ForumReply saved = createReply(10L, thread, null, "Reply content", 0);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Reply content", null);
        ForumReplyResponse result = forumService.createReply(1L, "testuser", request);

        assertThat(result.getContent()).isEqualTo("Reply content");
        assertThat(result.getDepth()).isEqualTo(0);
        assertThat(result.getParentReplyId()).isNull();
    }

    @Test
    void createReply_nestedReply_setsDepthFromParent() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply parent = createReply(10L, thread, null, "Parent", 0);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(replyRepository.findById(10L)).thenReturn(Optional.of(parent));

        ForumReply saved = createReply(20L, thread, parent, "Child reply", 1);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Child reply", 10L);
        ForumReplyResponse result = forumService.createReply(1L, "testuser", request);

        assertThat(result.getDepth()).isEqualTo(1);
        assertThat(result.getParentReplyId()).isEqualTo(10L);
    }

    @Test
    void createReply_atMaxDepth_throwsBadRequest() {
        // MAX_REPLY_DEPTH = 3, so parent at depth 2 means child would be depth 3 => rejected
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply parent = createReply(10L, thread, null, "Deep parent", 2);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(replyRepository.findById(10L)).thenReturn(Optional.of(parent));

        CreateReplyRequest request = new CreateReplyRequest("Too deep", 10L);

        assertThatThrownBy(() -> forumService.createReply(1L, "testuser", request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(400);
    }

    @Test
    void createReply_atMaxDepthMinusOne_succeeds() {
        // Parent at depth 1, child at depth 2 (< MAX_REPLY_DEPTH=3) => allowed
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply parent = createReply(10L, thread, null, "Parent", 1);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(replyRepository.findById(10L)).thenReturn(Optional.of(parent));

        ForumReply saved = createReply(20L, thread, parent, "Reply at depth 2", 2);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Reply at depth 2", 10L);
        ForumReplyResponse result = forumService.createReply(1L, "testuser", request);

        assertThat(result.getDepth()).isEqualTo(2);
    }

    @Test
    void createReply_withUnknownUser_throws404() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        CreateReplyRequest request = new CreateReplyRequest("Content", null);

        assertThatThrownBy(() -> forumService.createReply(1L, "unknown", request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createReply_withUnknownThread_throws404() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(999L)).thenReturn(Optional.empty());

        CreateReplyRequest request = new CreateReplyRequest("Content", null);

        assertThatThrownBy(() -> forumService.createReply(999L, "testuser", request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Thread not found");
    }

    @Test
    void createReply_withUnknownParentReply_throws404() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(replyRepository.findById(999L)).thenReturn(Optional.empty());

        CreateReplyRequest request = new CreateReplyRequest("Content", 999L);

        assertThatThrownBy(() -> forumService.createReply(1L, "testuser", request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Parent reply not found");
    }

    @Test
    void createReply_directReply_returnsEmptyChildList() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));

        ForumReply saved = createReply(10L, thread, null, "Content", 0);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Content", null);
        ForumReplyResponse result = forumService.createReply(1L, "testuser", request);

        assertThat(result.getReplies()).isNotNull().isEmpty();
    }

    // ============================================================
    // vote — thread and reply
    // ============================================================

    @Test
    void vote_newVoteOnThread_createsVoteAndUpdatesScore() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "thread"))
                .thenReturn(Optional.empty());

        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setScore(0);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(1L, "thread", "voter", 1);

        assertThat(result.getPostId()).isEqualTo(1L);
        assertThat(result.getPostType()).isEqualTo("thread");
        assertThat(result.getNewScore()).isEqualTo(1);
        assertThat(result.getUserVote()).isEqualTo(1);
        verify(voteRepository).save(any(ForumVote.class));
        verify(threadRepository).save(any(ForumThread.class));
    }

    @Test
    void vote_newDownvoteOnThread_setsNegativeScore() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "thread"))
                .thenReturn(Optional.empty());

        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setScore(0);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(1L, "thread", "voter", -1);

        assertThat(result.getNewScore()).isEqualTo(-1);
        assertThat(result.getUserVote()).isEqualTo(-1);
    }

    @Test
    void vote_existingVoteReversal_adjustsScoreCorrectly() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));

        ForumVote existingVote = new ForumVote(voter, 1L, "thread", 1);
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "thread"))
                .thenReturn(Optional.of(existingVote));

        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setScore(5);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenAnswer(inv -> inv.getArgument(0));

        // Change from upvote (1) to downvote (-1): score = 5 - 1 + (-1) = 3
        VoteResponse result = forumService.vote(1L, "thread", "voter", -1);

        assertThat(result.getNewScore()).isEqualTo(3);
        assertThat(result.getUserVote()).isEqualTo(-1);
    }

    @Test
    void vote_existingVoteRemoval_adjustsScoreToZero() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));

        ForumVote existingVote = new ForumVote(voter, 1L, "thread", 1);
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "thread"))
                .thenReturn(Optional.of(existingVote));

        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setScore(1);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenAnswer(inv -> inv.getArgument(0));

        // Remove vote (0): score = 1 - 1 + 0 = 0
        VoteResponse result = forumService.vote(1L, "thread", "voter", 0);

        assertThat(result.getNewScore()).isEqualTo(0);
        assertThat(result.getUserVote()).isEqualTo(0);
    }

    @Test
    void vote_onReply_updatesReplyScore() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 10L, "reply"))
                .thenReturn(Optional.empty());

        ForumReply reply = createReply(10L, createThread(1L, "T", "D"), null, "Content", 0);
        reply.setScore(0);
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));
        when(replyRepository.save(any(ForumReply.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(10L, "reply", "voter", 1);

        assertThat(result.getPostId()).isEqualTo(10L);
        assertThat(result.getPostType()).isEqualTo("reply");
        assertThat(result.getNewScore()).isEqualTo(1);
        verify(replyRepository).save(any(ForumReply.class));
    }

    @Test
    void vote_existingVoteOnReply_adjustsCorrectly() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));

        ForumVote existingVote = new ForumVote(voter, 10L, "reply", -1);
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 10L, "reply"))
                .thenReturn(Optional.of(existingVote));

        ForumReply reply = createReply(10L, createThread(1L, "T", "D"), null, "Content", 0);
        reply.setScore(-1);
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));
        when(replyRepository.save(any(ForumReply.class))).thenAnswer(inv -> inv.getArgument(0));

        // Change from downvote (-1) to upvote (1): score = -1 - (-1) + 1 = 1
        VoteResponse result = forumService.vote(10L, "reply", "voter", 1);

        assertThat(result.getNewScore()).isEqualTo(1);
    }

    @Test
    void vote_invalidPostType_throwsBadRequest() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "invalid"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.vote(1L, "invalid", "voter", 1))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(400);
    }

    @Test
    void vote_unknownUser_throws404() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.vote(1L, "thread", "unknown", 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void vote_threadNotFound_throws404() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 999L, "thread"))
                .thenReturn(Optional.empty());
        when(threadRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.vote(999L, "thread", "voter", 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Thread not found");
    }

    @Test
    void vote_replyNotFound_throws404() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 999L, "reply"))
                .thenReturn(Optional.empty());
        when(replyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.vote(999L, "reply", "voter", 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Reply not found");
    }

    // ============================================================
    // deleteThread
    // ============================================================

    @Test
    void deleteThread_asOwner_deletesSuccessfully() {
        AppUser owner = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(owner));

        forumService.deleteThread(1L, "testuser");

        verify(threadRepository).delete(thread);
    }

    @Test
    void deleteThread_asAdmin_deletesSuccessfully() {
        AppUser admin = createUser("admin");
        admin.setRole(Role.ADMIN);
        ForumThread thread = createThread(1L, "Title", "Desc");
        // Thread owned by testuser, not admin
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        forumService.deleteThread(1L, "admin");

        verify(threadRepository).delete(thread);
    }

    @Test
    void deleteThread_asNonOwnerNonAdmin_throwsForbidden() {
        AppUser other = createUser("otheruser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername("otheruser")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> forumService.deleteThread(1L, "otheruser"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(403);
    }

    @Test
    void deleteThread_threadNotFound_throws404() {
        when(threadRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.deleteThread(999L, "testuser"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Thread not found");
    }

    @Test
    void deleteThread_userNotFound_throws404() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.deleteThread(1L, "unknown"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    // ============================================================
    // getReplyById
    // ============================================================

    @Test
    void getReplyById_whenFound_returnsReply() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply reply = createReply(10L, thread, null, "Content", 0);
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));

        ForumReply result = forumService.getReplyById(10L);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getContent()).isEqualTo("Content");
    }

    @Test
    void getReplyById_whenNotFound_throws404() {
        when(replyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.getReplyById(999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Reply not found");
    }

    // ============================================================
    // vote — additional boundary / arithmetic tests
    // ============================================================

    @Test
    void vote_newVoteOnThread_scoreCalculationStartingFromPositive() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "thread"))
                .thenReturn(Optional.empty());

        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setScore(10);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(1L, "thread", "voter", 1);

        assertThat(result.getNewScore()).isEqualTo(11);
    }

    @Test
    void vote_existingVote_sameVoteValue_doesNotChangeScore() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));

        ForumVote existingVote = new ForumVote(voter, 1L, "thread", 1);
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "thread"))
                .thenReturn(Optional.of(existingVote));

        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setScore(5);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(1L, "thread", "voter", 1);

        // score = 5 - 1 + 1 = 5 (unchanged)
        assertThat(result.getNewScore()).isEqualTo(5);
    }

    @Test
    void vote_existingDownvoteOnReply_changeToUpvote_adjustsBy2() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));

        ForumVote existingVote = new ForumVote(voter, 10L, "reply", -1);
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 10L, "reply"))
                .thenReturn(Optional.of(existingVote));

        ForumReply reply = createReply(10L, createThread(1L, "T", "D"), null, "Content", 0);
        reply.setScore(3);
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));
        when(replyRepository.save(any(ForumReply.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(10L, "reply", "voter", 1);

        // score = 3 - (-1) + 1 = 5
        assertThat(result.getNewScore()).isEqualTo(5);
        assertThat(result.getUserVote()).isEqualTo(1);
        assertThat(result.getPostType()).isEqualTo("reply");
        assertThat(result.getPostId()).isEqualTo(10L);
    }

    @Test
    void vote_newDownvoteOnReply_decreasesScore() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 10L, "reply"))
                .thenReturn(Optional.empty());

        ForumReply reply = createReply(10L, createThread(1L, "T", "D"), null, "Content", 0);
        reply.setScore(2);
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));
        when(replyRepository.save(any(ForumReply.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(10L, "reply", "voter", -1);

        assertThat(result.getNewScore()).isEqualTo(1);
    }

    @Test
    void vote_removeExistingVoteOnReply_adjustsScore() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));

        ForumVote existingVote = new ForumVote(voter, 10L, "reply", 1);
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 10L, "reply"))
                .thenReturn(Optional.of(existingVote));

        ForumReply reply = createReply(10L, createThread(1L, "T", "D"), null, "Content", 0);
        reply.setScore(5);
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));
        when(replyRepository.save(any(ForumReply.class))).thenAnswer(inv -> inv.getArgument(0));

        VoteResponse result = forumService.vote(10L, "reply", "voter", 0);

        // score = 5 - 1 + 0 = 4
        assertThat(result.getNewScore()).isEqualTo(4);
        assertThat(result.getUserVote()).isEqualTo(0);
    }

    // ============================================================
    // getThreads — additional coverage for paged size
    // ============================================================

    @Test
    void getThreads_alwaysReturnsSizeOf20() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 0, null);

        assertThat(result.getSize()).isEqualTo(20);
    }

    @Test
    void getThreads_pageParameter_passedCorrectly() {
        Page<ForumThread> page = new PageImpl<>(Collections.emptyList());
        when(threadRepository.findAll(any(Pageable.class))).thenReturn(page);

        PagedThreadsResponse result = forumService.getThreads(null, "newest", 3, null);

        assertThat(result.getPage()).isEqualTo(3);
        verify(threadRepository).findAll(argThat((Pageable p) -> p.getPageNumber() == 3));
    }

    @Test
    void getThreads_withSearchAndCategory_searchBranchTakesPriority() {
        ForumThread thread = createThread(1L, "Java Guide", "Desc");
        Page<ForumThread> page = new PageImpl<>(List.of(thread));
        when(threadRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                eq("java"), eq("java"), any(Pageable.class))).thenReturn(page);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        PagedThreadsResponse result = forumService.getThreads(5L, "newest", 0, "java");

        assertThat(result.getThreads()).hasSize(1);
        verify(threadRepository, never()).findByCategoryId(anyLong(), any(Pageable.class));
        verify(threadRepository, never()).findAll(any(Pageable.class));
    }

    // ============================================================
    // createThread — additional field verification
    // ============================================================

    @Test
    void createThread_verifyAllFieldsOnSavedThread() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumThread saved = createThread(1L, "Title", "Description");
        saved.setScore(0);
        saved.setCreatedAt(LocalDateTime.of(2026, 1, 1, 12, 0));
        saved.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 12, 0));
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("Title", "Description", null);
        ForumThreadResponse result = forumService.createThread("testuser", request);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Title");
        assertThat(result.getDescription()).isEqualTo("Description");
        assertThat(result.getScore()).isEqualTo(0);
        assertThat(result.getAuthorUsername()).isEqualTo("testuser");
        assertThat(result.getReplyCount()).isEqualTo(0);
        assertThat(result.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 12, 0));
        assertThat(result.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 12, 0));
        assertThat(result.getCategoryId()).isNull();
        assertThat(result.getCategoryName()).isNull();
    }

    // ============================================================
    // createReply — all response fields verified
    // ============================================================

    @Test
    void createReply_allResponseFieldsPopulated() {
        AppUser author = createUser("replier");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("replier")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));

        ForumReply saved = createReply(10L, thread, null, "Reply text", 0);
        saved.setScore(3);
        saved.setCreatedAt(LocalDateTime.of(2026, 2, 15, 9, 0));
        saved.setAuthor(author);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Reply text", null);
        ForumReplyResponse result = forumService.createReply(1L, "replier", request);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getContent()).isEqualTo("Reply text");
        assertThat(result.getScore()).isEqualTo(3);
        assertThat(result.getDepth()).isEqualTo(0);
        assertThat(result.getAuthorUsername()).isEqualTo("replier");
        assertThat(result.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 2, 15, 9, 0));
        assertThat(result.getParentReplyId()).isNull();
        assertThat(result.getReplies()).isEmpty();
    }

    // ============================================================
    // deleteThread — additional isOwner/isAdmin boundary tests
    // ============================================================

    @Test
    void deleteThread_asOwner_notAdmin_succeeds() {
        AppUser owner = createUser("threadauthor");
        owner.setRole(Role.USER);
        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setAuthor(owner);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername("threadauthor")).thenReturn(Optional.of(owner));

        forumService.deleteThread(1L, "threadauthor");

        verify(threadRepository).delete(thread);
    }

    @Test
    void deleteThread_asAdmin_notOwner_succeeds() {
        AppUser admin = createUser("adminuser");
        admin.setRole(Role.ADMIN);
        AppUser threadOwner = createUser("owner");
        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setAuthor(threadOwner);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername("adminuser")).thenReturn(Optional.of(admin));

        forumService.deleteThread(1L, "adminuser");

        verify(threadRepository).delete(thread);
    }

    @Test
    void deleteThread_nonOwnerWithUserRole_throwsForbidden() {
        AppUser other = createUser("other");
        other.setRole(Role.USER);
        AppUser threadOwner = createUser("owner");
        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setAuthor(threadOwner);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername("other")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> forumService.deleteThread(1L, "other"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(403);
    }

    // ============================================================
    // getThread — verify thread detail response fields
    // ============================================================

    @Test
    void getThread_mapsAllThreadDetailFields() {
        ForumThread thread = createThread(1L, "Thread title", "Thread desc");
        thread.setScore(42);
        thread.setCreatedAt(LocalDateTime.of(2026, 6, 15, 10, 0));
        thread.setUpdatedAt(LocalDateTime.of(2026, 6, 16, 11, 0));
        ForumCategory cat = createCategory(5L, "Tech", "Technology", "laptop");
        thread.setCategory(cat);

        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(7L);
        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Thread title");
        assertThat(result.getDescription()).isEqualTo("Thread desc");
        assertThat(result.getScore()).isEqualTo(42);
        assertThat(result.getAuthorUsername()).isEqualTo("testuser");
        assertThat(result.getCategoryId()).isEqualTo(5L);
        assertThat(result.getCategoryName()).isEqualTo("Tech");
        assertThat(result.getReplyCount()).isEqualTo(7);
        assertThat(result.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 15, 10, 0));
        assertThat(result.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 6, 16, 11, 0));
        assertThat(result.getReplies()).isEmpty();
    }

    // ============================================================
    // buildReplyTree — depth boundary - should not recurse at depth 2
    // ============================================================

    @Test
    void getThread_buildReplyTree_doesNotCallFindByParentReplyIdAtMaxDepth() {
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumReply root = createReply(10L, thread, null, "Root", 0);
        ForumReply d1 = createReply(20L, thread, root, "Depth1", 1);

        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(root));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(List.of(d1));
        // At depth 1, currentDepth < MAX_REPLY_DEPTH - 1 (1 < 2), so still recurse
        when(replyRepository.findByParentReplyId(20L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        assertThat(result.getReplies()).hasSize(1);
        assertThat(result.getReplies().get(0).getReplies()).hasSize(1);
        assertThat(result.getReplies().get(0).getReplies().get(0).getReplies()).isEmpty();
    }

    // ============================================================
    // Mutation-killing tests: verify entities passed to save()
    // ============================================================

    @Test
    void createThread_verifySavedEntityHasAuthor() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumThread saved = createThread(1L, "Title", "Desc");
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("Title", "Desc", null);
        forumService.createThread("testuser", request);

        verify(threadRepository).save(argThat(thread ->
                thread.getAuthor() != null && "testuser".equals(thread.getAuthor().getUsername())));
    }

    @Test
    void createThread_verifySavedEntityHasTitle() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumThread saved = createThread(1L, "My Title", "Desc");
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("My Title", "Desc", null);
        forumService.createThread("testuser", request);

        verify(threadRepository).save(argThat(thread ->
                "My Title".equals(thread.getTitle())));
    }

    @Test
    void createThread_verifySavedEntityHasDescription() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumThread saved = createThread(1L, "Title", "My description");
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("Title", "My description", null);
        forumService.createThread("testuser", request);

        verify(threadRepository).save(argThat(thread ->
                "My description".equals(thread.getDescription())));
    }

    @Test
    void createThread_withCategory_verifySavedEntityHasCategory() {
        AppUser author = createUser("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));

        ForumCategory cat = createCategory(5L, "Tech", "Technology", "icon");
        when(categoryRepository.findById(5L)).thenReturn(Optional.of(cat));

        ForumThread saved = createThread(1L, "Title", "Desc");
        saved.setCategory(cat);
        when(threadRepository.save(any(ForumThread.class))).thenReturn(saved);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        CreateThreadRequest request = new CreateThreadRequest("Title", "Desc", 5L);
        forumService.createThread("testuser", request);

        verify(threadRepository).save(argThat(thread ->
                thread.getCategory() != null && thread.getCategory().getId().equals(5L)));
    }

    @Test
    void createReply_verifySavedEntityHasThread() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));

        ForumReply saved = createReply(10L, thread, null, "Content", 0);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Content", null);
        forumService.createReply(1L, "testuser", request);

        verify(replyRepository).save(argThat(reply ->
                reply.getThread() != null && reply.getThread().getId().equals(1L)));
    }

    @Test
    void createReply_verifySavedEntityHasAuthor() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));

        ForumReply saved = createReply(10L, thread, null, "Content", 0);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Content", null);
        forumService.createReply(1L, "testuser", request);

        verify(replyRepository).save(argThat(reply ->
                reply.getAuthor() != null && "testuser".equals(reply.getAuthor().getUsername())));
    }

    @Test
    void createReply_verifySavedEntityHasContent() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));

        ForumReply saved = createReply(10L, thread, null, "My reply content", 0);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("My reply content", null);
        forumService.createReply(1L, "testuser", request);

        verify(replyRepository).save(argThat(reply ->
                "My reply content".equals(reply.getContent())));
    }

    @Test
    void createReply_verifySavedEntityHasCorrectDepth() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply parent = createReply(10L, thread, null, "Parent", 1);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(replyRepository.findById(10L)).thenReturn(Optional.of(parent));

        ForumReply saved = createReply(20L, thread, parent, "Child", 2);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Child", 10L);
        forumService.createReply(1L, "testuser", request);

        verify(replyRepository).save(argThat(reply -> reply.getDepth() == 2));
    }

    @Test
    void createReply_nestedReply_verifySavedEntityHasParentReply() {
        AppUser author = createUser("testuser");
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply parent = createReply(10L, thread, null, "Parent", 0);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(replyRepository.findById(10L)).thenReturn(Optional.of(parent));

        ForumReply saved = createReply(20L, thread, parent, "Child", 1);
        when(replyRepository.save(any(ForumReply.class))).thenReturn(saved);

        CreateReplyRequest request = new CreateReplyRequest("Child", 10L);
        forumService.createReply(1L, "testuser", request);

        verify(replyRepository).save(argThat(reply ->
                reply.getParentReply() != null && reply.getParentReply().getId().equals(10L)));
    }

    @Test
    void vote_existingVote_verifySavedVoteHasNewValue() {
        AppUser voter = createUser("voter");
        when(userRepository.findByUsername("voter")).thenReturn(Optional.of(voter));

        ForumVote existingVote = new ForumVote(voter, 1L, "thread", 1);
        when(voteRepository.findByVoterUsernameAndPostIdAndPostType("voter", 1L, "thread"))
                .thenReturn(Optional.of(existingVote));

        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setScore(5);
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenAnswer(inv -> inv.getArgument(0));

        forumService.vote(1L, "thread", "voter", -1);

        verify(voteRepository).save(argThat(vote -> vote.getVoteValue() == -1));
    }

    @Test
    void buildReplyTree_atDepthOne_recursesWithIncrementedDepth() {
        // Test that buildReplyTree correctly increments depth:
        // At root level (depth 0), with MAX_REPLY_DEPTH=3, children at depth 1 should also recurse
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumReply root = createReply(10L, thread, null, "Root", 0);
        ForumReply child = createReply(20L, thread, root, "Child", 1);
        ForumReply grandchild = createReply(30L, thread, child, "Grandchild", 2);

        when(replyRepository.findByThreadIdAndParentReplyIsNull(1L)).thenReturn(List.of(root));
        when(replyRepository.findByParentReplyId(10L)).thenReturn(List.of(child));
        when(replyRepository.findByParentReplyId(20L)).thenReturn(List.of(grandchild));
        // At depth 2 (MAX_REPLY_DEPTH - 1 = 2), should still call findByParentReplyId but NOT recurse children
        when(replyRepository.findByParentReplyId(30L)).thenReturn(Collections.emptyList());

        ForumThreadDetailResponse result = forumService.getThread(1L);

        // Verify full tree: root -> child -> grandchild (no children)
        ForumReplyResponse rootResp = result.getReplies().get(0);
        assertThat(rootResp.getReplies()).hasSize(1);
        ForumReplyResponse childResp = rootResp.getReplies().get(0);
        assertThat(childResp.getReplies()).hasSize(1);
        ForumReplyResponse grandchildResp = childResp.getReplies().get(0);
        assertThat(grandchildResp.getContent()).isEqualTo("Grandchild");
        assertThat(grandchildResp.getReplies()).isEmpty();

        // Verify findByParentReplyId was called for grandchild (depth 2), but children are empty
        verify(replyRepository).findByParentReplyId(30L);
    }

    // ============================================================
    // helpers
    // ============================================================

    private AppUser createUser(String username) {
        AppUser user = new AppUser("user@example.com", username, "encoded", Role.USER);
        return user;
    }

    private ForumCategory createCategory(Long id, String name, String description, String icon) {
        ForumCategory cat = new ForumCategory(name, description, icon);
        cat.setId(id);
        return cat;
    }

    private ForumThread createThread(Long id, String title, String description) {
        ForumThread thread = new ForumThread();
        thread.setId(id);
        thread.setTitle(title);
        thread.setDescription(description);
        thread.setAuthor(createUser("testuser"));
        thread.setScore(0);
        return thread;
    }

    private ForumReply createReply(Long id, ForumThread thread, ForumReply parent, String content, int depth) {
        ForumReply reply = new ForumReply();
        reply.setId(id);
        reply.setThread(thread);
        reply.setParentReply(parent);
        reply.setContent(content);
        reply.setDepth(depth);
        reply.setScore(0);
        reply.setAuthor(createUser("testuser"));
        return reply;
    }

    // ============================================================
    // setThreadClosed — moderator/admin close/reopen thread
    // ============================================================

    @Test
    void setThreadClosed_asModerator_closesThread() {
        AppUser mod = createUser("mod");
        mod.setRole(Role.MODERATOR);
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("mod")).thenReturn(Optional.of(mod));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenReturn(thread);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumThreadResponse result = forumService.setThreadClosed(1L, "mod", true);

        assertThat(result).isNotNull();
        verify(threadRepository).save(thread);
    }

    @Test
    void setThreadClosed_asAdmin_closesThread() {
        AppUser admin = createUser("admin");
        admin.setRole(Role.ADMIN);
        ForumThread thread = createThread(1L, "Title", "Desc");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(threadRepository.save(any(ForumThread.class))).thenReturn(thread);
        when(threadRepository.countRepliesByThreadId(1L)).thenReturn(0L);

        ForumThreadResponse result = forumService.setThreadClosed(1L, "admin", true);

        assertThat(result).isNotNull();
    }

    @Test
    void setThreadClosed_asRegularUser_throwsForbidden() {
        AppUser user = createUser("user");
        when(userRepository.findByUsername("user")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> forumService.setThreadClosed(1L, "user", true))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(403);
    }

    @Test
    void setThreadClosed_userNotFound_throws404() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.setThreadClosed(1L, "ghost", true))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void setThreadClosed_threadNotFound_throws404() {
        AppUser mod = createUser("mod");
        mod.setRole(Role.MODERATOR);
        when(userRepository.findByUsername("mod")).thenReturn(Optional.of(mod));
        when(threadRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.setThreadClosed(999L, "mod", true))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Thread not found");
    }

    // ============================================================
    // deleteReply — moderator/admin delete reply
    // ============================================================

    @Test
    void deleteReply_asModerator_deletesReply() {
        AppUser mod = createUser("mod");
        mod.setRole(Role.MODERATOR);
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply reply = createReply(10L, thread, null, "content", 0);
        when(userRepository.findByUsername("mod")).thenReturn(Optional.of(mod));
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));

        forumService.deleteReply(10L, "mod");

        verify(replyRepository).delete(reply);
    }

    @Test
    void deleteReply_asAdmin_deletesReply() {
        AppUser admin = createUser("admin");
        admin.setRole(Role.ADMIN);
        ForumThread thread = createThread(1L, "Title", "Desc");
        ForumReply reply = createReply(10L, thread, null, "content", 0);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(replyRepository.findById(10L)).thenReturn(Optional.of(reply));

        forumService.deleteReply(10L, "admin");

        verify(replyRepository).delete(reply);
    }

    @Test
    void deleteReply_asRegularUser_throwsForbidden() {
        AppUser user = createUser("user");
        when(userRepository.findByUsername("user")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> forumService.deleteReply(10L, "user"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(403);
    }

    @Test
    void deleteReply_userNotFound_throws404() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.deleteReply(10L, "ghost"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void deleteReply_replyNotFound_throws404() {
        AppUser mod = createUser("mod");
        mod.setRole(Role.MODERATOR);
        when(userRepository.findByUsername("mod")).thenReturn(Optional.of(mod));
        when(replyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.deleteReply(999L, "mod"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Reply not found");
    }

    // ============================================================
    // listUsers — admin list all users
    // ============================================================

    @Test
    void listUsers_asAdmin_returnsAllUsers() {
        AppUser admin = createUser("admin");
        admin.setRole(Role.ADMIN);
        AppUser user1 = createUser("alice");
        AppUser user2 = createUser("bob");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findAll()).thenReturn(List.of(admin, user1, user2));

        List<UserSummaryResponse> result = forumService.listUsers("admin");

        assertThat(result).hasSize(3);
        assertThat(result).extracting(UserSummaryResponse::getUsername)
                .contains("admin", "alice", "bob");
    }

    @Test
    void listUsers_roleNameInResponse() {
        AppUser admin = createUser("admin");
        admin.setRole(Role.ADMIN);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findAll()).thenReturn(List.of(admin));

        List<UserSummaryResponse> result = forumService.listUsers("admin");

        assertThat(result.get(0).getRole()).isEqualTo("ADMIN");
    }

    @Test
    void listUsers_asRegularUser_throwsForbidden() {
        AppUser user = createUser("user");
        when(userRepository.findByUsername("user")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> forumService.listUsers("user"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(403);
    }

    @Test
    void listUsers_asModerator_throwsForbidden() {
        AppUser mod = createUser("mod");
        mod.setRole(Role.MODERATOR);
        when(userRepository.findByUsername("mod")).thenReturn(Optional.of(mod));

        assertThatThrownBy(() -> forumService.listUsers("mod"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(403);
    }

    @Test
    void listUsers_userNotFound_throws404() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forumService.listUsers("ghost"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }

    // ============================================================
    // createReply — closed thread rejection
    // ============================================================

    @Test
    void createReply_closedThread_throwsForbidden() {
        AppUser author = createUser("author");
        ForumThread thread = createThread(1L, "Title", "Desc");
        thread.setIsClosed(true);
        when(userRepository.findByUsername("author")).thenReturn(Optional.of(author));
        when(threadRepository.findById(1L)).thenReturn(Optional.of(thread));

        CreateReplyRequest request = new CreateReplyRequest("content", null);

        assertThatThrownBy(() -> forumService.createReply(1L, "author", request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("status.value")
                .isEqualTo(403);
    }

}
