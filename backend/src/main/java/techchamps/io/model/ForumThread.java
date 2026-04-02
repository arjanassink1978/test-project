package techchamps.io.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_threads")
public class ForumThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private AppUser author;

    // CONSTRAINT: title max 200 — must match frontend validation
    @Column(nullable = false, length = 200)
    private String title;

    // CONSTRAINT: description max 5000 — must match frontend validation
    @Column(length = 5000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ForumCategory category;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private int score = 0;

    public ForumThread() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public AppUser getAuthor() { return author; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public ForumCategory getCategory() { return category; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public int getScore() { return score; }

    public void setId(Long id) { this.id = id; }
    public void setAuthor(AppUser author) { this.author = author; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(ForumCategory category) { this.category = category; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setScore(int score) { this.score = score; }
}
