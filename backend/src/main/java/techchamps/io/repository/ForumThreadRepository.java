package techchamps.io.repository;

import techchamps.io.model.ForumThread;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ForumThreadRepository extends JpaRepository<ForumThread, Long> {

    Page<ForumThread> findByCategoryId(Long categoryId, Pageable pageable);

    Page<ForumThread> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String title, String description, Pageable pageable);

    @Query("SELECT COUNT(r) FROM ForumReply r WHERE r.thread.id = :threadId")
    long countRepliesByThreadId(Long threadId);

    long countByCategoryId(Long categoryId);
}
