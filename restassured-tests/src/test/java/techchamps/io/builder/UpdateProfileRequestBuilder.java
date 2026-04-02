package techchamps.io.builder;

import techchamps.io.dto.request.UpdateProfileRequest;

public class UpdateProfileRequestBuilder {

    private String displayName = "Test User";
    private String bio = "A short bio for testing purposes";
    private String location = "Amsterdam, Netherlands";

    public UpdateProfileRequestBuilder displayName(String displayName) {
        this.displayName = displayName;
        return this;
    }

    public UpdateProfileRequestBuilder bio(String bio) {
        this.bio = bio;
        return this;
    }

    public UpdateProfileRequestBuilder location(String location) {
        this.location = location;
        return this;
    }

    public UpdateProfileRequest build() {
        return new UpdateProfileRequest(displayName, bio, location);
    }
}
