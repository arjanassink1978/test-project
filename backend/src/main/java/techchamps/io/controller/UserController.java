package techchamps.io.controller;

import techchamps.io.dto.response.UserSummaryResponse;
import techchamps.io.service.ForumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Admin endpoints for user management")
public class UserController {

    private final ForumService forumService;

    public UserController(ForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping
    @Operation(summary = "List all users", description = "Requires ADMIN role")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of users",
            content = @Content(schema = @Schema(implementation = UserSummaryResponse.class))),
        @ApiResponse(responseCode = "403", description = "Forbidden — requires ADMIN role")
    })
    public ResponseEntity<List<UserSummaryResponse>> listUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(forumService.listUsers(userDetails.getUsername()));
    }
}
