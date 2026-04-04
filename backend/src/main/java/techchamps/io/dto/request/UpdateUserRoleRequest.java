package techchamps.io.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import techchamps.io.model.Role;

@Schema(description = "Request to update the role of a user")
public class UpdateUserRoleRequest {

    @NotNull(message = "Role is required")
    @Schema(description = "New role to assign", example = "MODERATOR")
    private Role role;

    public UpdateUserRoleRequest() {}

    public UpdateUserRoleRequest(Role role) {
        this.role = role;
    }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
