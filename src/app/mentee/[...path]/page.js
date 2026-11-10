import MenteeDashboard from '@/components/mentee/dashboard';
import { notFound } from 'next/navigation';
export default async function MenteeSection({params}){
  const {path}=await params;
  if(path.length===1&&path[0]==='profile')return <MenteeDashboard initialView="profile"/>;
  if(!/^[a-f\d]{24}$/i.test(path[0]||''))notFound();
  if(path.length===1)return <MenteeDashboard initialProgram={path[0]}/>;
  if(path.length===2&&['scores','leaderboard'].includes(path[1]))return <MenteeDashboard initialProgram={path[0]} initialView={path[1]}/>;
  if(path.length===3&&path[1]==='resources'&&/^[a-f\d]{24}$/i.test(path[2]))return <MenteeDashboard initialProgram={path[0]} initialView="resource" initialResource={path[2]}/>;
  notFound();
}
