package techchamps.io.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import techchamps.io.dto.request.CreateCategoryRequest;
import techchamps.io.dto.request.UpdateCategoryRequest;
import techchamps.io.dto.request.UpdateUserRoleRequest;
import techchamps.io.dto.response.ForumCategoryResponse;
import techchamps.io.dto.response.UserSummaryResponse;
import techchamps.io.model.AppUser;
import techchamps.io.model.ForumCategory;
import techchamps.io.model.Role;
import techchamps.io.repository.AppUserRepository;
import techchamps.io.repository.ForumCategoryRepository;
import techchamps.io.repository.ForumThreadRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private ForumCategoryRepository categoryRepository;

    @Mock
    private ForumThreadRepository threadRepository;

    @InjectMocks
    private AdminService adminService;

    // ===== searchUsers =====

    @Test
    void searchUsers_returnsPagedResults() {
        AppUser user = buildUser(1L, "alice", "alice@example.com", Role.USER);
        Page<AppUser> userPage = new PageImpl<>(List.of(user));
        Pageable pageable = PageRequest.of(0, 20);

        when(userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                "alice", "alice", pageable)).thenReturn(userPage);

        Page<UserSummaryResponse> result = adminService.searchUsers("alice", pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getUsername()).isEqualTo("alice");
        assertThat(result.getContent().get(0).getRole()).isEqualTo("USER");
    }

    @Test
    void searchUsers_emptyQuery_returnsEmptyPage() {
        Page<AppUser> emptyPage = new PageImpl<>(List.of());
        Pageable pageable = PageRequest.of(0, 20);

        when(userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                "", "", pageable)).thenReturn(emptyPage);

        Page<UserSummaryResponse> result = adminService.searchUsers("", pageable);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
    }

    // ===== updateUserRole =====

    @Test
    void updateUserRole_success_returnsUpdatedUser() {
        AppUser admin = buildUser(1L, "admin", "admin@example.com", Role.ADMIN);
        AppUser target = buildUser(2L, "user", "user@example.com", Role.USER);
        AppUser saved = buildUser(2L, "user", "user@example.com", Role.MODERATOR);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.save(target)).thenReturn(saved);

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.MODERATOR);
        UserSummaryResponse result = adminService.updateUserRole("admin", 2L, request);

        assertThat(result.getRole()).isEqualTo("MODERATOR");
        assertThat(result.getId()).isEqualTo(2L);
        verify(userRepository).save(target);
    }

    @Test
    void updateUserRole_selfChange_throws400() {
        AppUser admin = buildUser(1L, "admin", "admin@example.com", Role.ADMIN);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.USER);

        assertThatThrownBy(() -> adminService.updateUserRole("admin", 1L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Cannot change your own role");
                });
    }

    @Test
    void updateUserRole_demoteLastAdmin_throws400() {
        AppUser admin = buildUser(1L, "admin", "admin@example.com", Role.ADMIN);
        AppUser target = buildUser(2L, "admin2", "admin2@example.com", Role.ADMIN);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(target));

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.USER);

        assertThatThrownBy(() -> adminService.updateUserRole("admin", 2L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Cannot demote the last admin");
                });
    }

    @Test
    void updateUserRole_multipleAdmins_demoteSucceeds() {
        AppUser admin = buildUser(1L, "admin", "admin@example.com", Role.ADMIN);
        AppUser target = buildUser(2L, "admin2", "admin2@example.com", Role.ADMIN);
        AppUser saved = buildUser(2L, "admin2", "admin2@example.com", Role.USER);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(admin, target));
        when(userRepository.save(target)).thenReturn(saved);

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.USER);
        UserSummaryResponse result = adminService.updateUserRole("admin", 2L, request);

        assertThat(result.getRole()).isEqualTo("USER");
    }

    @Test
    void updateUserRole_targetNotFound_throws404() {
        AppUser admin = buildUser(1L, "admin", "admin@example.com", Role.ADMIN);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.MODERATOR);

        assertThatThrownBy(() -> adminService.updateUserRole("admin", 99L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void updateUserRole_adminNotFound_throws404() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.MODERATOR);

        assertThatThrownBy(() -> adminService.updateUserRole("ghost", 2L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ===== createCategory =====

    @Test
    void createCategory_success_returnsSavedCategory() {
        ForumCategory saved = new ForumCategory("General", "General discussions", "icon");
        saved.setId(1L);

        when(categoryRepository.save(any(ForumCategory.class))).thenReturn(saved);

        CreateCategoryRequest request = new CreateCategoryRequest("General", "General discussions", "icon");
        ForumCategoryResponse result = adminService.createCategory(request);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("General");
        assertThat(result.getDescription()).isEqualTo("General discussions");
        assertThat(result.getIcon()).isEqualTo("icon");
    }

    @Test
    void createCategory_withNullDescription_succeeds() {
        ForumCategory saved = new ForumCategory("Tech", null, null);
        saved.setId(2L);

        when(categoryRepository.save(any(ForumCategory.class))).thenReturn(saved);

        CreateCategoryRequest request = new CreateCategoryRequest("Tech", null, null);
        ForumCategoryResponse result = adminService.createCategory(request);

        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getDescription()).isNull();
    }

    // ===== updateCategory =====

    @Test
    void updateCategory_success_returnsUpdatedCategory() {
        ForumCategory existing = new ForumCategory("Old", "Old desc", "old-icon");
        existing.setId(1L);
        ForumCategory saved = new ForumCategory("New", "New desc", "new-icon");
        saved.setId(1L);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(existing)).thenReturn(saved);

        UpdateCategoryRequest request = new UpdateCategoryRequest("New", "New desc", "new-icon");
        ForumCategoryResponse result = adminService.updateCategory(1L, request);

        assertThat(result.getName()).isEqualTo("New");
        assertThat(result.getDescription()).isEqualTo("New desc");
        assertThat(result.getIcon()).isEqualTo("new-icon");
        verify(categoryRepository).save(existing);
    }

    @Test
    void updateCategory_notFound_throws404() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateCategoryRequest request = new UpdateCategoryRequest("Name", null, null);

        assertThatThrownBy(() -> adminService.updateCategory(99L, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ===== deleteCategory =====

    @Test
    void deleteCategory_success_deletesCategory() {
        ForumCategory category = new ForumCategory("Empty", null, null);
        category.setId(1L);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(threadRepository.countByCategoryId(1L)).thenReturn(0L);

        adminService.deleteCategory(1L);

        verify(categoryRepository).delete(category);
    }

    @Test
    void deleteCategory_withThreads_throws409() {
        ForumCategory category = new ForumCategory("Busy", null, null);
        category.setId(1L);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(threadRepository.countByCategoryId(1L)).thenReturn(3L);

        assertThatThrownBy(() -> adminService.deleteCategory(1L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(rse.getReason()).contains("Cannot delete category with existing threads");
                });
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void deleteCategory_notFound_throws404() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deleteCategory(99L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ===== helpers =====

    private AppUser buildUser(Long id, String username, String email, Role role) {
        AppUser user = new AppUser(email, username, "password", role);
        // Reflectively set ID via a helper since there's no setId
        try {
            var field = AppUser.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return user;
    }
}
