import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage(props: PageProps<"/profile/[username]">) {
  const { username } = await props.params;

  return <ProfileForm username={username} />;
}

