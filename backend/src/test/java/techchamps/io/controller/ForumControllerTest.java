package techchamps.io.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import techchamps.io.config.CorsConfig;
import techchamps.io.config.SecurityConfig;
import techchamps.io.dto.request.CreateReplyRequest;
import techchamps.io.dto.request.CreateThreadRequest;
import techchamps.io.dto.request.VoteRequest;
import techchamps.io.dto.response.*;
import techchamps.io.model.ForumReply;
import techchamps.io.model.ForumThread;
import techchamps.io.model.AppUser;
import techchamps.io.service.ForumService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ForumController.class)
@Import({SecurityConfig.class, CorsConfig.class, ForumControllerTest.TestSecurityConfig.class})
class ForumControllerTest {

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        UserDetailsService userDetailsService() {
            return username -> {
                throw new UsernameNotFoundException("No users in test context");
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ForumService forumService;

    // ============================================================
    // GET /api/forum/categories
    // ============================================================

    @Test
    void getCategories_returns200WithList() throws Exception {
        ForumCategoryResponse cat = new ForumCategoryResponse(1L, "General", "General discussions", "icon");
        when(forumService.getAllCategories()).thenReturn(List.of(cat));

        mockMvc.perform(get("/api/forum/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("General"))
                .andExpect(jsonPath("$[0].description").value("General discussions"))
                .andExpect(jsonPath("$[0].icon").value("icon"));
    }

    @Test
    void getCategories_whenEmpty_returns200WithEmptyList() throws Exception {
        when(forumService.getAllCategories()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/forum/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ============================================================
    // GET /api/forum/threads
    // ============================================================

    @Test
    void getThreads_defaultParams_returns200() throws Exception {
        PagedThreadsResponse pagedResp = new PagedThreadsResponse(
                Collections.emptyList(), 0, 20, false);
        when(forumService.getThreads(isNull(), eq("newest"), eq(0), isNull()))
                .thenReturn(pagedResp);

        mockMvc.perform(get("/api/forum/threads"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.hasMore").value(false))
                .andExpect(jsonPath("$.threads").isArray());
    }

    @Test
    void getThreads_withCategoryAndSort_passesParams() throws Exception {
        PagedThreadsResponse pagedResp = new PagedThreadsResponse(
                Collections.emptyList(), 0, 20, false);
        when(forumService.getThreads(eq(5L), eq("popular"), eq(1), isNull()))
                .thenReturn(pagedResp);

        mockMvc.perform(get("/api/forum/threads")
                        .param("category", "5")
                        .param("sort", "popular")
                        .param("page", "1"))
                .andExpect(status().isOk());

        verify(forumService).getThreads(eq(5L), eq("popular"), eq(1), isNull());
    }

    @Test
    void getThreads_withSearch_passesSearchParam() throws Exception {
        PagedThreadsResponse pagedResp = new PagedThreadsResponse(
                Collections.emptyList(), 0, 20, false);
        when(forumService.getThreads(isNull(), eq("newest"), eq(0), eq("java")))
                .thenReturn(pagedResp);

        mockMvc.perform(get("/api/forum/threads")
                        .param("search", "java"))
                .andExpect(status().isOk());

        verify(forumService).getThreads(isNull(), eq("newest"), eq(0), eq("java"));
    }

    // ============================================================
    // GET /api/forum/threads/{id}
    // ============================================================

    @Test
    void getThread_whenFound_returns200() throws Exception {
        ForumThreadDetailResponse detail = new ForumThreadDetailResponse();
        detail.setId(1L);
        detail.setTitle("Thread Title");
        detail.setDescription("Thread description");
        detail.setScore(5);
        detail.setAuthorUsername("testuser");
        detail.setReplies(Collections.emptyList());
        when(forumService.getThread(1L)).thenReturn(detail);

        mockMvc.perform(get("/api/forum/threads/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Thread Title"))
                .andExpect(jsonPath("$.description").value("Thread description"))
                .andExpect(jsonPath("$.score").value(5))
                .andExpect(jsonPath("$.authorUsername").value("testuser"))
                .andExpect(jsonPath("$.replies").isArray());
    }

    @Test
    void getThread_whenNotFound_returns404() throws Exception {
        when(forumService.getThread(999L))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));

        mockMvc.perform(get("/api/forum/threads/999"))
                .andExpect(status().isNotFound());
    }

    // ============================================================
    // POST /api/forum/threads (auth required)
    // ============================================================

    @Test
    @WithMockUser(username = "testuser")
    void createThread_validRequest_returns201() throws Exception {
        ForumThreadResponse response = new ForumThreadResponse();
        response.setId(1L);
        response.setTitle("New thread");
        response.setDescription("Desc");
        response.setAuthorUsername("testuser");
        when(forumService.createThread(eq("testuser"), any(CreateThreadRequest.class)))
                .thenReturn(response);

        CreateThreadRequest request = new CreateThreadRequest("New thread", "Desc", null);

        mockMvc.perform(post("/api/forum/threads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("New thread"))
                .andExpect(jsonPath("$.authorUsername").value("testuser"));
    }

    @Test
    void createThread_unauthenticated_returns401() throws Exception {
        CreateThreadRequest request = new CreateThreadRequest("Title", "Desc", null);

        mockMvc.perform(post("/api/forum/threads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void createThread_blankTitle_returns400() throws Exception {
        CreateThreadRequest request = new CreateThreadRequest("", "Description", null);

        mockMvc.perform(post("/api/forum/threads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser")
    void createThread_titleTooLong_returns400() throws Exception {
        CreateThreadRequest request = new CreateThreadRequest("x".repeat(201), "Description", null);

        mockMvc.perform(post("/api/forum/threads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser")
    void createThread_descriptionTooLong_returns400() throws Exception {
        CreateThreadRequest request = new CreateThreadRequest("Title", "x".repeat(5001), null);

        mockMvc.perform(post("/api/forum/threads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ============================================================
    // POST /api/forum/threads/{threadId}/replies (auth required)
    // ============================================================

    @Test
    @WithMockUser(username = "testuser")
    void createThreadReply_validRequest_returns201() throws Exception {
        ForumReplyResponse response = new ForumReplyResponse();
        response.setId(10L);
        response.setContent("Reply content");
        response.setDepth(0);
        response.setAuthorUsername("testuser");
        response.setReplies(Collections.emptyList());
        when(forumService.createReply(eq(1L), eq("testuser"), any(CreateReplyRequest.class)))
                .thenReturn(response);

        CreateReplyRequest request = new CreateReplyRequest("Reply content", null);

        mockMvc.perform(post("/api/forum/threads/1/replies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.content").value("Reply content"))
                .andExpect(jsonPath("$.depth").value(0));
    }

    @Test
    void createThreadReply_unauthenticated_returns401() throws Exception {
        CreateReplyRequest request = new CreateReplyRequest("Content", null);

        mockMvc.perform(post("/api/forum/threads/1/replies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void createThreadReply_blankContent_returns400() throws Exception {
        CreateReplyRequest request = new CreateReplyRequest("", null);

        mockMvc.perform(post("/api/forum/threads/1/replies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testuser")
    void createThreadReply_contentTooLong_returns400() throws Exception {
        CreateReplyRequest request = new CreateReplyRequest("x".repeat(2001), null);

        mockMvc.perform(post("/api/forum/threads/1/replies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ============================================================
    // POST /api/forum/replies/{replyId}/replies (nested reply)
    // ============================================================

    @Test
    @WithMockUser(username = "testuser")
    void createNestedReply_validRequest_returns201() throws Exception {
        ForumThread thread = new ForumThread();
        thread.setId(1L);
        ForumReply parentReply = new ForumReply();
        parentReply.setId(10L);
        parentReply.setThread(thread);
        parentReply.setDepth(0);

        when(forumService.getReplyById(10L)).thenReturn(parentReply);

        ForumReplyResponse response = new ForumReplyResponse();
        response.setId(20L);
        response.setContent("Nested reply");
        response.setDepth(1);
        response.setParentReplyId(10L);
        response.setReplies(Collections.emptyList());
        when(forumService.createReply(eq(1L), eq("testuser"), any(CreateReplyRequest.class)))
                .thenReturn(response);

        CreateReplyRequest request = new CreateReplyRequest("Nested reply", null);

        mockMvc.perform(post("/api/forum/replies/10/replies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.content").value("Nested reply"))
                .andExpect(jsonPath("$.depth").value(1));
    }

    @Test
    void createNestedReply_unauthenticated_returns401() throws Exception {
        CreateReplyRequest request = new CreateReplyRequest("Content", null);

        mockMvc.perform(post("/api/forum/replies/10/replies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ============================================================
    // POST /api/forum/posts/{postId}/vote
    // ============================================================

    @Test
    @WithMockUser(username = "voter")
    void vote_validUpvote_returns200() throws Exception {
        VoteResponse response = new VoteResponse(1L, "thread", 1, 1);
        when(forumService.vote(eq(1L), eq("thread"), eq("voter"), eq(1)))
                .thenReturn(response);

        VoteRequest request = new VoteRequest(1);

        mockMvc.perform(post("/api/forum/posts/1/vote")
                        .param("postType", "thread")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postId").value(1))
                .andExpect(jsonPath("$.postType").value("thread"))
                .andExpect(jsonPath("$.newScore").value(1))
                .andExpect(jsonPath("$.userVote").value(1));
    }

    @Test
    @WithMockUser(username = "voter")
    void vote_defaultPostType_usesThread() throws Exception {
        VoteResponse response = new VoteResponse(1L, "thread", 1, 1);
        when(forumService.vote(eq(1L), eq("thread"), eq("voter"), eq(1)))
                .thenReturn(response);

        VoteRequest request = new VoteRequest(1);

        mockMvc.perform(post("/api/forum/posts/1/vote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(forumService).vote(eq(1L), eq("thread"), eq("voter"), eq(1));
    }

    @Test
    void vote_unauthenticated_returns401() throws Exception {
        VoteRequest request = new VoteRequest(1);

        mockMvc.perform(post("/api/forum/posts/1/vote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ============================================================
    // DELETE /api/forum/threads/{id}
    // ============================================================

    @Test
    @WithMockUser(username = "testuser")
    void deleteThread_asOwner_returns204() throws Exception {
        doNothing().when(forumService).deleteThread(1L, "testuser");

        mockMvc.perform(delete("/api/forum/threads/1"))
                .andExpect(status().isNoContent());

        verify(forumService).deleteThread(1L, "testuser");
    }

    @Test
    @WithMockUser(username = "otheruser")
    void deleteThread_notOwnerNotAdmin_returns403() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own threads"))
                .when(forumService).deleteThread(1L, "otheruser");

        mockMvc.perform(delete("/api/forum/threads/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteThread_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/forum/threads/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void deleteThread_notFound_returns404() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"))
                .when(forumService).deleteThread(999L, "testuser");

        mockMvc.perform(delete("/api/forum/threads/999"))
                .andExpect(status().isNotFound());
    }
}
