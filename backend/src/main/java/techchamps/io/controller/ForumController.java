package techchamps.io.controller;

import techchamps.io.dto.request.CreateReplyRequest;
import techchamps.io.dto.request.CreateThreadRequest;
import techchamps.io.dto.request.VoteRequest;
import techchamps.io.dto.response.*;
import techchamps.io.model.ForumReply;
import techchamps.io.service.ForumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@Tag(name = "Forum", description = "Endpoints for forum threads, replies, and voting")
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all forum categories")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of categories",
            content = @Content(schema = @Schema(implementation = ForumCategoryResponse.class)))
    })
    public ResponseEntity<List<ForumCategoryResponse>> getCategories() {
        return ResponseEntity.ok(forumService.getAllCategories());
    }

    @GetMapping("/threads")
    @Operation(summary = "Get paginated list of threads",
        description = "Supports filtering by category, sorting (newest, popular), searching, and pagination")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated thread list",
            content = @Content(schema = @Schema(implementation = PagedThreadsResponse.class)))
    })
    public ResponseEntity<PagedThreadsResponse> getThreads(
            @RequestParam(required = false) Long category,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(forumService.getThreads(category, sort, page, search));
    }

    @GetMapping("/threads/{id}")
    @Operation(summary = "Get thread by ID with full reply tree")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thread with replies",
            content = @Content(schema = @Schema(implementation = ForumThreadDetailResponse.class))),
        @ApiResponse(responseCode = "404", description = "Thread not found")
    })
    public ResponseEntity<ForumThreadDetailResponse> getThread(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getThread(id));
    }

    @PostMapping("/threads")
    @Operation(summary = "Create a new forum thread", description = "Requires authentication")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Thread created",
            content = @Content(schema = @Schema(implementation = ForumThreadResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated")
    })
    public ResponseEntity<ForumThreadResponse> createThread(
            @Valid @RequestBody CreateThreadRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ForumThreadResponse response = forumService.createThread(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/threads/{id}/close")
    @Operation(summary = "Close or reopen a thread", description = "Requires MODERATOR or ADMIN role")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thread closed/reopened",
            content = @Content(schema = @Schema(implementation = ForumThreadResponse.class))),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires MODERATOR or ADMIN"),
        @ApiResponse(responseCode = "404", description = "Thread not found")
    })
    public ResponseEntity<ForumThreadResponse> closeThread(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean closed,
            @AuthenticationPrincipal UserDetails userDetails) {
        ForumThreadResponse response = forumService.setThreadClosed(id, userDetails.getUsername(), closed);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/threads/{threadId}/replies")
    @Operation(summary = "Create a reply on a thread", description = "Requires authentication")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Reply created",
            content = @Content(schema = @Schema(implementation = ForumReplyResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error or max depth exceeded"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "403", description = "Thread is closed"),
        @ApiResponse(responseCode = "404", description = "Thread not found")
    })
    public ResponseEntity<ForumReplyResponse> createThreadReply(
            @PathVariable Long threadId,
            @Valid @RequestBody CreateReplyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ForumReplyResponse response = forumService.createReply(threadId, userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/replies/{replyId}/replies")
    @Operation(summary = "Create a nested reply on a reply", description = "Requires authentication; max depth 3")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Nested reply created",
            content = @Content(schema = @Schema(implementation = ForumReplyResponse.class))),
        @ApiResponse(responseCode = "400", description = "Max nesting depth exceeded"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "404", description = "Parent reply not found")
    })
    public ResponseEntity<ForumReplyResponse> createNestedReply(
            @PathVariable Long replyId,
            @Valid @RequestBody CreateReplyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ForumReply parentReply = forumService.getReplyById(replyId);
        CreateReplyRequest nestedRequest = new CreateReplyRequest(request.getContent(), replyId);
        ForumReplyResponse response = forumService.createReply(
                parentReply.getThread().getId(), userDetails.getUsername(), nestedRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/replies/{id}")
    @Operation(summary = "Delete a reply", description = "Requires MODERATOR or ADMIN role")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Reply deleted"),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires MODERATOR or ADMIN"),
        @ApiResponse(responseCode = "404", description = "Reply not found")
    })
    public ResponseEntity<Void> deleteReply(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        forumService.deleteReply(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{postId}/vote")
    @Operation(summary = "Upvote or downvote a post", description = "Requires authentication; voteValue: 1, 0, or -1")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Vote recorded",
            content = @Content(schema = @Schema(implementation = VoteResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid vote value or post type"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "404", description = "Post not found")
    })
    public ResponseEntity<VoteResponse> vote(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "thread") String postType,
            @Valid @RequestBody VoteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VoteResponse response = forumService.vote(postId, postType, userDetails.getUsername(), request.getVoteValue());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/threads/{id}")
    @Operation(summary = "Delete a thread", description = "Requires ownership or ADMIN role")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Thread deleted"),
        @ApiResponse(responseCode = "403", description = "Forbidden — not owner or admin"),
        @ApiResponse(responseCode = "404", description = "Thread not found")
    })
    public ResponseEntity<Void> deleteThread(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        forumService.deleteThread(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
