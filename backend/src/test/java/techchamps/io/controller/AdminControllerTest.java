package techchamps.io.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import techchamps.io.config.CorsConfig;
import techchamps.io.config.SecurityConfig;
import techchamps.io.dto.request.CreateCategoryRequest;
import techchamps.io.dto.request.UpdateCategoryRequest;
import techchamps.io.dto.request.UpdateUserRoleRequest;
import techchamps.io.dto.response.ForumCategoryResponse;
import techchamps.io.dto.response.UserSummaryResponse;
import techchamps.io.model.Role;
import techchamps.io.security.JwtAuthenticationFilter;
import techchamps.io.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, CorsConfig.class, AdminControllerTest.TestSecurityConfig.class})
class AdminControllerTest {

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        UserDetailsService userDetailsService() {
            return username -> {
                throw new UsernameNotFoundException("No users in test context");
            };
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(UserDetailsService userDetailsService) {
            return new JwtAuthenticationFilter("test-secret-key-that-is-at-least-32-bytes-long!", userDetailsService);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    // ===== GET /api/admin/users =====

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void searchUsers_asAdmin_returns200() throws Exception {
        UserSummaryResponse user = new UserSummaryResponse(1L, "alice", "alice@example.com", "USER");
        when(adminService.searchUsers(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user)));

        mockMvc.perform(get("/api/admin/users").param("query", "alice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("alice"));
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void searchUsers_asUser_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void searchUsers_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void searchUsers_emptyQuery_returnsEmptyPage() throws Exception {
        when(adminService.searchUsers(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/admin/users").param("query", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    // ===== PUT /api/admin/users/{userId}/role =====

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void updateUserRole_asAdmin_returns200() throws Exception {
        UserSummaryResponse updated = new UserSummaryResponse(2L, "bob", "bob@example.com", "MODERATOR");
        when(adminService.updateUserRole(eq("admin"), eq(2L), any(UpdateUserRoleRequest.class)))
                .thenReturn(updated);

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.MODERATOR);

        mockMvc.perform(put("/api/admin/users/2/role")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MODERATOR"))
                .andExpect(jsonPath("$.id").value(2));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void updateUserRole_selfChange_returns400() throws Exception {
        when(adminService.updateUserRole(eq("admin"), eq(1L), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change your own role"));

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.USER);

        mockMvc.perform(put("/api/admin/users/1/role")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void updateUserRole_lastAdmin_returns400() throws Exception {
        when(adminService.updateUserRole(eq("admin"), eq(2L), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot demote the last admin"));

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.USER);

        mockMvc.perform(put("/api/admin/users/2/role")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void updateUserRole_userNotFound_returns404() throws Exception {
        when(adminService.updateUserRole(eq("admin"), eq(99L), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.MODERATOR);

        mockMvc.perform(put("/api/admin/users/99/role")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void updateUserRole_asUser_returns403() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.MODERATOR);

        mockMvc.perform(put("/api/admin/users/2/role")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ===== POST /api/admin/categories =====

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createCategory_asAdmin_returns201() throws Exception {
        ForumCategoryResponse created = new ForumCategoryResponse(1L, "General", "General discussions", "icon");
        when(adminService.createCategory(any(CreateCategoryRequest.class))).thenReturn(created);

        CreateCategoryRequest request = new CreateCategoryRequest("General", "General discussions", "icon");

        mockMvc.perform(post("/api/admin/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("General"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createCategory_blankName_returns400() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("", "desc", "icon");

        mockMvc.perform(post("/api/admin/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createCategory_nameTooLong_returns400() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("A".repeat(51), "desc", "icon");

        mockMvc.perform(post("/api/admin/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createCategory_descriptionTooLong_returns400() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("Name", "D".repeat(201), "icon");

        mockMvc.perform(post("/api/admin/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void createCategory_asUser_returns403() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("General", "desc", "icon");

        mockMvc.perform(post("/api/admin/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ===== PUT /api/admin/categories/{id} =====

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void updateCategory_asAdmin_returns200() throws Exception {
        ForumCategoryResponse updated = new ForumCategoryResponse(1L, "Updated", "Updated desc", "icon2");
        when(adminService.updateCategory(eq(1L), any(UpdateCategoryRequest.class))).thenReturn(updated);

        UpdateCategoryRequest request = new UpdateCategoryRequest("Updated", "Updated desc", "icon2");

        mockMvc.perform(put("/api/admin/categories/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void updateCategory_notFound_returns404() throws Exception {
        when(adminService.updateCategory(eq(99L), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        UpdateCategoryRequest request = new UpdateCategoryRequest("Name", null, null);

        mockMvc.perform(put("/api/admin/categories/99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // ===== DELETE /api/admin/categories/{id} =====

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void deleteCategory_asAdmin_returns204() throws Exception {
        doNothing().when(adminService).deleteCategory(1L);

        mockMvc.perform(delete("/api/admin/categories/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void deleteCategory_withThreads_returns409() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete category with existing threads"))
                .when(adminService).deleteCategory(1L);

        mockMvc.perform(delete("/api/admin/categories/1"))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void deleteCategory_notFound_returns404() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"))
                .when(adminService).deleteCategory(99L);

        mockMvc.perform(delete("/api/admin/categories/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void deleteCategory_asUser_returns403() throws Exception {
        mockMvc.perform(delete("/api/admin/categories/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteCategory_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/admin/categories/1"))
                .andExpect(status().isUnauthorized());
    }
}
