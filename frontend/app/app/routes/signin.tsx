import SignInComp from "app/components/signin/signin";

export function meta() {
  return [
    { title: "Sign in | Ruh Care" },
    { name: "description", content: "Sign in for Ruh care" },
  ];
}

export default function SignIn() {
  return <SignInComp />;
}
