import { redirect } from 'next/navigation';
export default function Page({ params }: { params: { token: string } }) {
  redirect(`/consumer/exam-session/${params.token}`);
}
