/** Yazılarım'dan bir metni sonradan yeniden yazmak. */
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { exerciseById } from '../content';
import { isWriting } from '../content/types';
import WritingStep from '../components/WritingStep';
import { TopBar } from '../components/ui';
import { go } from '../lib/router';

export default function RewriteLater({ attemptId }: { attemptId: number }) {
  const data = useLiveQuery(async () => {
    const a = await db.attempts.get(attemptId);
    if (!a) return null;
    const root = a.rootId ?? a.id!;
    const count = await db.attempts.where('rootId').equals(root).count();
    return { a, root, nextVersion: count + 2 };
  }, [attemptId]);

  if (data === undefined) return null;
  const ex = data ? exerciseById.get(data.a.exerciseId) : undefined;
  if (!data || !ex || !isWriting(ex)) {
    return (
      <div>
        <TopBar title="Yeniden yaz" />
        <div className="empty">Bu yazı bulunamadı.</div>
      </div>
    );
  }
  return (
    <div>
      <TopBar title="Yeniden yaz" onBack={() => go('/writings')} />
      <WritingStep
        ex={ex}
        rootId={data.root}
        startVersion={data.nextVersion}
        initialText={data.a.response as string | Record<string, string>}
        task={data.a.aiFeedback?.rewriteTask}
        onDone={() => go('/writings')}
        doneLabel="Yazılarım'a dön"
      />
    </div>
  );
}
