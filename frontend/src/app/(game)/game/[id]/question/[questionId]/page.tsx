import QuestionClient from './QuestionClient';

type PageProps = {
  params: Promise<{ id: string; questionId: string }>;
};

/**
 * Server component shell for the question page.
 * All heavy game state is already in Redux from game/[id] hydration.
 * This page simply extracts the params and passes them to the client component.
 */
export default async function QuestionPage({ params }: PageProps) {
  const { id, questionId } = await params;

  return <QuestionClient gameId={id} questionId={parseInt(questionId, 10)} />;
}
