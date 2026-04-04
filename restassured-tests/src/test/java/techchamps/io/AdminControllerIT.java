package techchamps.io;

import techchamps.io.builder.CreateCategoryRequestBuilder;
import techchamps.io.builder.UpdateUserRoleRequestBuilder;
import techchamps.io.builder.CreateThreadRequestBuilder;
import techchamps.io.dto.request.CreateCategoryRequest;
import techchamps.io.dto.request.UpdateUserRoleRequest;
import techchamps.io.dto.response.ForumCategoryResponse;
import techchamps.io.dto.response.UserSummaryResponse;
import techchamps.io.model.Role;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import java.util.Arrays;
import java.util.List;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Admin endpoints.
 *
 * Tests cover:
 * - User search with RBAC (admin pass, moderator/unauthenticated fail)
 * - Role update with guards (cannot change own role, cannot demote last admin)
 * - Category CRUD with RBAC and boundary tests
 * - Boundary tests: category name at 50 (pass) and 51 (fail), description at 200 (pass) and 201 (fail)
 * - Category deletion guard: cannot delete if category has threads (409)
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Admin API Integration Tests")
class AdminControllerIT extends BaseIntegrationTest {

    // -------------------------------------------------------------------------
    // User search — RBAC
    // -------------------------------------------------------------------------

    @Test
    @Order(1)
    @DisplayName("GET /api/admin/users — admin can search users (200)")
    void searchUsers_asAdmin_returns200WithUsers() {
        String token = adminToken();
        io.restassured.response.Response response = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .get("/api/admin/users")
        .then()
            .statusCode(200)
            .extract().response();

        // Extract users from paginated response (content field)
        List<UserSummaryResponse> users = Arrays.asList(response.jsonPath().getObject("content", UserSummaryResponse[].class));

        assertThat(users).hasSizeGreaterThanOrEqualTo(3);
        assertThat(users).anyMatch(u -> "user".equals(u.getUsername()) && "USER".equals(u.getRole()));
        assertThat(users).anyMatch(u -> "moderator".equals(u.getUsername()) && "MODERATOR".equals(u.getRole()));
        assertThat(users).anyMatch(u -> "admin".equals(u.getUsername()) && "ADMIN".equals(u.getRole()));
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/admin/users — moderator cannot search users (403)")
    void searchUsers_asModerator_returns403() {
        String token = moderatorToken();
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .get("/api/admin/users")
        .then()
            .statusCode(403);
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/admin/users — unauthenticated returns 401")
    void searchUsers_unauthenticated_returns401() {
        given()
            .port(port)
        .when()
            .get("/api/admin/users")
        .then()
            .statusCode(401);
    }

    // -------------------------------------------------------------------------
    // Update user role — guards
    // -------------------------------------------------------------------------

    @Test
    @Order(4)
    @DisplayName("PUT /api/admin/users/{userId}/role — admin promotes user to moderator (200)")
    void updateUserRole_adminPromotesUserToModerator_returns200() {
        String adminToken = adminToken();
        UpdateUserRoleRequest request = new UpdateUserRoleRequestBuilder()
                .role(Role.MODERATOR)
                .build();

        // Get user id first (user id = 1)
        UserSummaryResponse response = given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/admin/users/{userId}/role", 1L)
        .then()
            .statusCode(200)
            .extract().as(UserSummaryResponse.class);

        assertThat(response.getRole()).isEqualTo("MODERATOR");
    }

    @Test
    @Order(5)
    @DisplayName("PUT /api/admin/users/{userId}/role — cannot change own role (400)")
    void updateUserRole_adminCannotChangeOwnRole_returns400() {
        String adminToken = adminToken();
        UpdateUserRoleRequest request = new UpdateUserRoleRequestBuilder()
                .role(Role.USER)
                .build();

        // admin id = 3
        given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/admin/users/{userId}/role", 3L)
        .then()
            .statusCode(400);
    }

    @Test
    @Order(6)
    @DisplayName("PUT /api/admin/users/{userId}/role — cannot demote last admin (400)")
    void updateUserRole_cannotDemoteLastAdmin_returns400() {
        String adminToken = adminToken();
        UpdateUserRoleRequest request = new UpdateUserRoleRequestBuilder()
                .role(Role.USER)
                .build();

        // The only admin cannot be demoted (admin id = 3)
        given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/admin/users/{userId}/role", 3L)
        .then()
            .statusCode(400);
    }

    @Test
    @Order(7)
    @DisplayName("PUT /api/admin/users/{userId}/role — moderator cannot update role (403)")
    void updateUserRole_asModerator_returns403() {
        String modToken = moderatorToken();
        UpdateUserRoleRequest request = new UpdateUserRoleRequestBuilder()
                .role(Role.ADMIN)
                .build();

        given()
            .port(port)
            .header("Authorization", "Bearer " + modToken)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/admin/users/{userId}/role", 1L)
        .then()
            .statusCode(403);
    }

    @Test
    @Order(8)
    @DisplayName("PUT /api/admin/users/{userId}/role — unauthenticated returns 401")
    void updateUserRole_unauthenticated_returns401() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequestBuilder()
                .role(Role.USER)
                .build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .put("/api/admin/users/{userId}/role", 1L)
        .then()
            .statusCode(401);
    }

    // -------------------------------------------------------------------------
    // Create category — RBAC + happy path
    // -------------------------------------------------------------------------

    @Test
    @Order(9)
    @DisplayName("POST /api/admin/categories — admin can create category (201)")
    void createCategory_asAdmin_returns201() {
        String token = adminToken();
        CreateCategoryRequest request = new CreateCategoryRequestBuilder()
                .name("Admin Test Category")
                .description("Category created by admin")
                .icon("test-icon")
                .build();

        ForumCategoryResponse response = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getName()).isEqualTo("Admin Test Category");
        assertThat(response.getDescription()).isEqualTo("Category created by admin");
        assertThat(response.getIcon()).isEqualTo("test-icon");
    }

    @Test
    @Order(10)
    @DisplayName("POST /api/admin/categories — moderator cannot create category (403)")
    void createCategory_asModerator_returns403() {
        String token = moderatorToken();
        CreateCategoryRequest request = new CreateCategoryRequestBuilder().build();

        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(403);
    }

    @Test
    @Order(11)
    @DisplayName("POST /api/admin/categories — unauthenticated returns 401")
    void createCategory_unauthenticated_returns401() {
        CreateCategoryRequest request = new CreateCategoryRequestBuilder().build();

        given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(401);
    }

    // -------------------------------------------------------------------------
    // Create category — boundary tests (name max 50, description max 200)
    // -------------------------------------------------------------------------

    @Test
    @Order(12)
    @DisplayName("POST /api/admin/categories — name exactly 50 chars (at boundary) → 201")
    void createCategory_nameExactly50Chars_returns201() {
        String token = adminToken();
        String name50 = "A".repeat(50);
        CreateCategoryRequest request = new CreateCategoryRequestBuilder()
                .name(name50)
                .build();

        ForumCategoryResponse response = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class);

        assertThat(response.getName()).isEqualTo(name50);
    }

    @Test
    @Order(13)
    @DisplayName("POST /api/admin/categories — name 51 chars (exceeds max) → 400")
    void createCategory_name51Chars_returns400() {
        String token = adminToken();
        String name51 = "B".repeat(51);
        CreateCategoryRequest request = new CreateCategoryRequestBuilder()
                .name(name51)
                .build();

        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(400);
    }

    @Test
    @Order(14)
    @DisplayName("POST /api/admin/categories — description exactly 200 chars (at boundary) → 201")
    void createCategory_descriptionExactly200Chars_returns201() {
        String token = adminToken();
        String desc200 = "D".repeat(200);
        CreateCategoryRequest request = new CreateCategoryRequestBuilder()
                .name("Boundary Test Category 200")
                .description(desc200)
                .build();

        ForumCategoryResponse response = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class);

        assertThat(response.getDescription()).isEqualTo(desc200);
    }

    @Test
    @Order(15)
    @DisplayName("POST /api/admin/categories — description 201 chars (exceeds max) → 400")
    void createCategory_description201Chars_returns400() {
        String token = adminToken();
        String desc201 = "E".repeat(201);
        CreateCategoryRequest request = new CreateCategoryRequestBuilder()
                .name("Boundary Test Category 201")
                .description(desc201)
                .build();

        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(400);
    }

    // -------------------------------------------------------------------------
    // Update category
    // -------------------------------------------------------------------------

    @Test
    @Order(16)
    @DisplayName("PUT /api/admin/categories/{id} — admin can update category (200)")
    void updateCategory_asAdmin_returns200() {
        String token = adminToken();

        // Create a category first
        Long categoryId = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(new CreateCategoryRequestBuilder()
                .name("Category to Update")
                .description("Original description")
                .build())
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class).getId();

        // Update it
        CreateCategoryRequest updateRequest = new CreateCategoryRequestBuilder()
                .name("Updated Category Name")
                .description("Updated description")
                .build();

        ForumCategoryResponse response = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/admin/categories/{id}", categoryId)
        .then()
            .statusCode(200)
            .extract().as(ForumCategoryResponse.class);

        assertThat(response.getName()).isEqualTo("Updated Category Name");
        assertThat(response.getDescription()).isEqualTo("Updated description");
    }

    // -------------------------------------------------------------------------
    // Delete category — guard: cannot delete if has threads
    // -------------------------------------------------------------------------

    @Test
    @Order(17)
    @DisplayName("DELETE /api/admin/categories/{id} — admin can delete empty category (204)")
    void deleteCategory_emptyCategory_returns204() {
        String adminToken = adminToken();

        // Create a category
        Long categoryId = given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(ContentType.JSON)
            .body(new CreateCategoryRequestBuilder()
                .name("Empty Category to Delete")
                .build())
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class).getId();

        // Delete it
        given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
        .when()
            .delete("/api/admin/categories/{id}", categoryId)
        .then()
            .statusCode(204);
    }

    @Test
    @Order(18)
    @DisplayName("DELETE /api/admin/categories/{id} — cannot delete category with threads (409)")
    void deleteCategory_categoryHasThreads_returns409() {
        String adminToken = adminToken();
        String userToken = userToken();

        // Create a category
        Long categoryId = given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(ContentType.JSON)
            .body(new CreateCategoryRequestBuilder()
                .name("Category With Thread")
                .build())
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class).getId();

        // Create a thread in it
        given()
            .port(port)
            .header("Authorization", "Bearer " + userToken)
            .contentType(ContentType.JSON)
            .body(new CreateThreadRequestBuilder()
                .categoryId(categoryId)
                .build())
        .when()
            .post("/api/forum/threads")
        .then()
            .statusCode(201);

        // Try to delete the category — should fail with 409
        given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
        .when()
            .delete("/api/admin/categories/{id}", categoryId)
        .then()
            .statusCode(409);
    }

    @Test
    @Order(19)
    @DisplayName("DELETE /api/admin/categories/{id} — moderator cannot delete category (403)")
    void deleteCategory_asModerator_returns403() {
        String adminToken = adminToken();
        String modToken = moderatorToken();

        // Create a category
        Long categoryId = given()
            .port(port)
            .header("Authorization", "Bearer " + adminToken)
            .contentType(ContentType.JSON)
            .body(new CreateCategoryRequestBuilder()
                .name("Category for Mod Delete Test")
                .build())
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class).getId();

        // Moderator tries to delete — should fail with 403
        given()
            .port(port)
            .header("Authorization", "Bearer " + modToken)
        .when()
            .delete("/api/admin/categories/{id}", categoryId)
        .then()
            .statusCode(403);
    }

    @Test
    @Order(20)
    @DisplayName("DELETE /api/admin/categories/{id} — unauthenticated returns 401")
    void deleteCategory_unauthenticated_returns401() {
        given()
            .port(port)
        .when()
            .delete("/api/admin/categories/{id}", 999)
        .then()
            .statusCode(401);
    }

    // -------------------------------------------------------------------------
    // Full functional flow: create multiple categories
    // -------------------------------------------------------------------------

    @Test
    @Order(21)
    @DisplayName("Admin category flow: create → list → update → delete")
    void adminCategoryFlow_fullFlow() {
        String token = adminToken();

        // Create category 1
        ForumCategoryResponse cat1 = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(new CreateCategoryRequestBuilder()
                .name("Flow Test Category 1")
                .description("First test category")
                .build())
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class);

        assertThat(cat1.getId()).isNotNull();
        assertThat(cat1.getName()).isEqualTo("Flow Test Category 1");

        // Create category 2
        ForumCategoryResponse cat2 = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(new CreateCategoryRequestBuilder()
                .name("Flow Test Category 2")
                .description("Second test category")
                .build())
        .when()
            .post("/api/admin/categories")
        .then()
            .statusCode(201)
            .extract().as(ForumCategoryResponse.class);

        assertThat(cat2.getId()).isNotNull();

        // Update category 1
        CreateCategoryRequest updateRequest = new CreateCategoryRequestBuilder()
                .name("Updated Flow Test Category 1")
                .description("Updated description")
                .build();

        ForumCategoryResponse updated = given()
            .port(port)
            .header("Authorization", "Bearer " + token)
            .contentType(ContentType.JSON)
            .body(updateRequest)
        .when()
            .put("/api/admin/categories/{id}", cat1.getId())
        .then()
            .statusCode(200)
            .extract().as(ForumCategoryResponse.class);

        assertThat(updated.getName()).isEqualTo("Updated Flow Test Category 1");

        // Delete category 2
        given()
            .port(port)
            .header("Authorization", "Bearer " + token)
        .when()
            .delete("/api/admin/categories/{id}", cat2.getId())
        .then()
            .statusCode(204);
    }
}
