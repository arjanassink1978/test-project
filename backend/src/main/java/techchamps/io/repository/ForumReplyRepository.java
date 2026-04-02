package techchamps.io.repository;

import techchamps.io.model.ForumReply;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ForumReplyRepository extends JpaRepository<ForumReply, Long> {

    List<ForumReply> findByThreadIdAndParentReplyIsNull(Long threadId);

    List<ForumReply> findByParentReplyId(Long parentReplyId);
}
