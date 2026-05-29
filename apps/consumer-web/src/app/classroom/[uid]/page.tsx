import { redirect } from 'next/navigation';
export default function Page({ params }: { params: { uid: string } }) {
  redirect(`/consumer/classroom/${params.uid}`);
}
