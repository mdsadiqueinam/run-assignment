import SignUpComp from "app/components/signin/signup";

export function meta() {
  return [
    { title: "Sign up | Ruh Care" },
    { name: "description", content: "Sign up for Ruh care" },
  ];
}

export default function SignIn() {
  return <SignUpComp />;
}
