import { redirect } from 'next/navigation';
export default function Page({ params }: { params: { uid: string; quizUid: string } }) {
  redirect(`/consumer/classroom/${params.uid}/quiz/${params.quizUid}`);
}
