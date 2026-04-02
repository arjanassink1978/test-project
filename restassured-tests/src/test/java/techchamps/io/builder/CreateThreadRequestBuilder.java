package techchamps.io.builder;

import techchamps.io.dto.request.CreateThreadRequest;

public class CreateThreadRequestBuilder {

    private String title = "Test Thread Title";
    private String description = "Test description content";
    private Long categoryId = 1L;

    public CreateThreadRequestBuilder title(String title) {
        this.title = title;
        return this;
    }

    public CreateThreadRequestBuilder description(String description) {
        this.description = description;
        return this;
    }

    public CreateThreadRequestBuilder categoryId(Long categoryId) {
        this.categoryId = categoryId;
        return this;
    }

    public CreateThreadRequest build() {
        return new CreateThreadRequest(title, description, categoryId);
    }
}
