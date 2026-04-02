package techchamps.io.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Paginated list of forum threads")
public class PagedThreadsResponse {

    @Schema(description = "List of threads for this page")
    private List<ForumThreadResponse> threads;

    @Schema(description = "Current page number (0-indexed)")
    private int page;

    @Schema(description = "Page size")
    private int size;

    @Schema(description = "Whether more pages are available")
    private boolean hasMore;

    public PagedThreadsResponse() {}

    public PagedThreadsResponse(List<ForumThreadResponse> threads, int page, int size, boolean hasMore) {
        this.threads = threads;
        this.page = page;
        this.size = size;
        this.hasMore = hasMore;
    }

    public List<ForumThreadResponse> getThreads() { return threads; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public boolean isHasMore() { return hasMore; }

    public void setThreads(List<ForumThreadResponse> threads) { this.threads = threads; }
    public void setPage(int page) { this.page = page; }
    public void setSize(int size) { this.size = size; }
    public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }
}
