package techchamps.io.service;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final AppUserRepository userRepository;
    private final ForumCategoryRepository categoryRepository;
    private final ForumThreadRepository threadRepository;

    public AdminService(AppUserRepository userRepository,
                        ForumCategoryRepository categoryRepository,
                        ForumThreadRepository threadRepository) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.threadRepository = threadRepository;
    }

    public Page<UserSummaryResponse> searchUsers(String query, Pageable pageable) {
        Page<AppUser> page = userRepository
                .findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable);
        return page.map(u -> new UserSummaryResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole().name()));
    }

    public UserSummaryResponse updateUserRole(String adminUsername, Long targetUserId, UpdateUserRoleRequest request) {
        AppUser admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));

        AppUser target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // CONSTRAINT: admin cannot change their own role
        if (admin.getId().equals(target.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change your own role");
        }

        // CONSTRAINT: cannot demote the last admin
        if (target.getRole() == Role.ADMIN && request.getRole() != Role.ADMIN) {
            List<AppUser> admins = userRepository.findByRole(Role.ADMIN);
            if (admins.size() <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot demote the last admin");
            }
        }

        target.setRole(request.getRole());
        AppUser saved = userRepository.save(target);
        return new UserSummaryResponse(saved.getId(), saved.getUsername(), saved.getEmail(), saved.getRole().name());
    }

    public ForumCategoryResponse createCategory(CreateCategoryRequest request) {
        ForumCategory category = new ForumCategory(request.getName(), request.getDescription(), request.getIcon());
        ForumCategory saved = categoryRepository.save(category);
        return new ForumCategoryResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getIcon());
    }

    public ForumCategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        ForumCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());

        ForumCategory saved = categoryRepository.save(category);
        return new ForumCategoryResponse(saved.getId(), saved.getName(), saved.getDescription(), saved.getIcon());
    }

    public void deleteCategory(Long id) {
        ForumCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        // CONSTRAINT: cannot delete category with threads (409 Conflict)
        long threadCount = threadRepository.countByCategoryId(id);
        if (threadCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete category with existing threads");
        }

        categoryRepository.delete(category);
    }
}
