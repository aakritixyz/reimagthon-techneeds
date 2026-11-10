import MentorPanel from '@/components/mentor/mentorPanel';
import { notFound } from 'next/navigation';
export default async function MentorSection({ params }) {
  const { path } = await params;
  if (!/^[a-f\d]{24}$/i.test(path[0] || '')) notFound();
  if (path.length === 2 && ['mentees','resources','grading','activity'].includes(path[1])) return <MentorPanel initialProgram={path[0]} initialView={path[1]} />;
  if (path.length === 4 && path[1] === 'resources' && /^[a-f\d]{24}$/i.test(path[2]) && path[3] === 'submissions') return <MentorPanel initialProgram={path[0]} initialView="grading" initialResource={path[2]} />;
  notFound();
}
