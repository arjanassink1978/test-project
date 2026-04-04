package techchamps.io.builder;

import techchamps.io.dto.request.CreateCategoryRequest;

public class CreateCategoryRequestBuilder {

    private String name = "Test Category";
    private String description = "A test category for testing";
    private String icon = "chat-bubble";

    public CreateCategoryRequestBuilder name(String name) {
        this.name = name;
        return this;
    }

    public CreateCategoryRequestBuilder description(String description) {
        this.description = description;
        return this;
    }

    public CreateCategoryRequestBuilder icon(String icon) {
        this.icon = icon;
        return this;
    }

    public CreateCategoryRequest build() {
        return new CreateCategoryRequest(name, description, icon);
    }
}
