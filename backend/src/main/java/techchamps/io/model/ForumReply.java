package techchamps.io.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_replies")
public class ForumReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thread_id", nullable = false)
    private ForumThread thread;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_reply_id")
    private ForumReply parentReply;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private AppUser author;

    // CONSTRAINT: reply content max 2000 — must match frontend validation
    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private int score = 0;

    // CONSTRAINT: depth max 3 levels (0-indexed) — backend rejects depth > 2
    private int depth = 0;

    public ForumReply() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public ForumThread getThread() { return thread; }
    public ForumReply getParentReply() { return parentReply; }
    public AppUser getAuthor() { return author; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public int getScore() { return score; }
    public int getDepth() { return depth; }

    public void setId(Long id) { this.id = id; }
    public void setThread(ForumThread thread) { this.thread = thread; }
    public void setParentReply(ForumReply parentReply) { this.parentReply = parentReply; }
    public void setAuthor(AppUser author) { this.author = author; }
    public void setContent(String content) { this.content = content; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setScore(int score) { this.score = score; }
    public void setDepth(int depth) { this.depth = depth; }
}
