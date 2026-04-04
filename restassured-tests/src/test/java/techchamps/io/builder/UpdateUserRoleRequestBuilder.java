package techchamps.io.builder;

import techchamps.io.dto.request.UpdateUserRoleRequest;
import techchamps.io.model.Role;

public class UpdateUserRoleRequestBuilder {

    private Role role = Role.MODERATOR;

    public UpdateUserRoleRequestBuilder role(Role role) {
        this.role = role;
        return this;
    }

    public UpdateUserRoleRequest build() {
        return new UpdateUserRoleRequest(role);
    }
}
