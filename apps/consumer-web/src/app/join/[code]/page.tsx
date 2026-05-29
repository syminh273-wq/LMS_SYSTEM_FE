import { redirect } from 'next/navigation';
export default function Page({ params }: { params: { code: string } }) {
  redirect(`/consumer/join/${params.code}`);
}
