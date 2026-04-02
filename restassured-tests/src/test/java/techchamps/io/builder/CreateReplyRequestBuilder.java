package techchamps.io.builder;

import techchamps.io.dto.request.CreateReplyRequest;

public class CreateReplyRequestBuilder {

    private String content = "Test reply content";
    private Long parentReplyId = null;

    public CreateReplyRequestBuilder content(String content) {
        this.content = content;
        return this;
    }

    public CreateReplyRequestBuilder parentReplyId(Long parentReplyId) {
        this.parentReplyId = parentReplyId;
        return this;
    }

    public CreateReplyRequest build() {
        return new CreateReplyRequest(content, parentReplyId);
    }
}
