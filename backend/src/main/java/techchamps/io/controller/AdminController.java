package techchamps.io.controller;

import techchamps.io.dto.request.CreateCategoryRequest;
import techchamps.io.dto.request.UpdateCategoryRequest;
import techchamps.io.dto.request.UpdateUserRoleRequest;
import techchamps.io.dto.response.ForumCategoryResponse;
import techchamps.io.dto.response.UserSummaryResponse;
import techchamps.io.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin panel endpoints for user and category management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    @Operation(summary = "Search users", description = "Search users by username or email. Requires ADMIN role.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of matching users",
            content = @Content(schema = @Schema(implementation = Page.class))),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires ADMIN role")
    })
    public ResponseEntity<Page<UserSummaryResponse>> searchUsers(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.searchUsers(query, pageable));
    }

    @PutMapping("/users/{userId}/role")
    @Operation(summary = "Update user role", description = "Change role of a user. Requires ADMIN role. Cannot change own role or demote last admin.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User role updated",
            content = @Content(schema = @Schema(implementation = UserSummaryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Cannot change own role or demote last admin"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires ADMIN role"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserSummaryResponse> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserSummaryResponse response = adminService.updateUserRole(userDetails.getUsername(), userId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/categories")
    @Operation(summary = "Create a forum category", description = "Create a new category. Requires ADMIN role.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Category created",
            content = @Content(schema = @Schema(implementation = ForumCategoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires ADMIN role")
    })
    public ResponseEntity<ForumCategoryResponse> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {
        ForumCategoryResponse response = adminService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update a forum category", description = "Update an existing category. Requires ADMIN role.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Category updated",
            content = @Content(schema = @Schema(implementation = ForumCategoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires ADMIN role"),
        @ApiResponse(responseCode = "404", description = "Category not found")
    })
    public ResponseEntity<ForumCategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        ForumCategoryResponse response = adminService.updateCategory(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Delete a forum category", description = "Delete a category. Requires ADMIN role. Cannot delete if threads exist.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Category deleted"),
        @ApiResponse(responseCode = "401", description = "Unauthenticated"),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires ADMIN role"),
        @ApiResponse(responseCode = "404", description = "Category not found"),
        @ApiResponse(responseCode = "409", description = "Conflict — category has existing threads")
    })
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        adminService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
