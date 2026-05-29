import { redirect } from 'next/navigation';
export default function Page({ params }: { params: { uid: string; examUid: string } }) {
  redirect(`/consumer/classroom/${params.uid}/exams/${params.examUid}`);
}
