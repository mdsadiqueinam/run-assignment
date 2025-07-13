import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";

export default function Signup() {
  const navigate = useNavigate();
  const {
    session: currentSession,
    logoutCurrentSession: _logoutCurrentSession,
    init: _initCurrentSession,
  } = useCurrentSession();
  const { isDark: _isDark } = useDarkMode();

  // State
  const [signupData, setSignupData] = useState({
    phone: "",
    permissionId: "client",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [_isLoading, _setIsLoading] = useState(false);

  // Computed values
  const formattedTimeZone = useMemo(() => {
    const gmtOffset = new Date()
      .toLocaleTimeString("en-us", {
        timeZone: signupData.timeZone,
        timeZoneName: "short",
      })
      .split(" ")[2];

    const formattedTimeZoneName = signupData.timeZone.replace(/_/g, " ");
    return `${gmtOffset} – ${formattedTimeZoneName}`;
  }, [signupData.timeZone]);

  const googleAuthUrl = "/auth/login/federated/google";

  // Handlers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData((prev) => ({ ...prev, phone: e.target.value }));
  };

  const handlePermissionChange = (permissionId: string) => {
    setSignupData((prev) => ({ ...prev, permissionId }));
  };

  const handleTimeZoneChange = (timeZone: string) => {
    setSignupData((prev) => ({ ...prev, timeZone }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/services/signup.json", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      const _data = await response.json();

      // Redirect to success page or dashboard
      navigate("/home");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignout = async () => {
    // Use the hook's logout function
    await _logoutCurrentSession();
  };

  useEffect(() => {
    _initCurrentSession();
  }, []);

  if (_isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-main">
        <svg
          className="h-8 w-8 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-main text-gray-900">
      <div className="m-0 flex max-w-screen-xl flex-1 justify-center overflow-hidden bg-sidebar shadow sm:m-10 sm:rounded-lg">
        <div className="w-full pb-[74px] pt-6 text-main-text sm:p-12 sm:pb-[74px] lg:w-1/2 xl:w-5/12">
          {/* Top navigation when logged in */}
          {currentSession && (
            <div className="-mt-5 mb-4 flex items-center justify-between">
              <div>
                <Link
                  to="/signin"
                  className="flex items-center gap-1 rounded-md border border-transparent py-1 pl-1 pr-3 text-xs text-sidebar-text transition-[border,background-color,color,opacity] duration-300 hover:border-divider-hover hover:bg-sidebar-hover hover:text-sidebar-text-hover"
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 19l-7-7 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <div className="text-xs text-[lch(63.975_1.933_272)]">
                      Back to
                    </div>
                    <div className="text-xs text-main-text">Sign in</div>
                  </div>
                </Link>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs text-[lch(63.975_1.933_272)]">
                      Logged in as:
                    </div>
                    <div className="text-xs text-main-text">
                      {currentSession?.email}
                    </div>
                  </div>
                  <button
                    onClick={handleSignout}
                    className="p-1 rounded hover:bg-sidebar-hover"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logo section */}
          <div className="pt-5">
            <img
              src="https://cdn.prod.website-files.com/64bfe68d3f479572876205b2/64cdca5e648369d914c4ac00_Ruh%20Main%20Logo.png"
              className="mx-auto w-60"
              alt="Logo"
            />
          </div>

          {/* Scrollable content section */}
          <div className="mt-12 flex max-h-[calc(100vh-200px)] w-full flex-col items-center overflow-y-auto pb-[50px]">
            {/* Step 1: Sign in */}
            {!currentSession && (
              <div className="mt-8 flex w-full flex-col gap-4">
                <h1 className="mx-0 mb-6 mt-0 border-0 p-0 text-center align-baseline text-2xl font-medium leading-8 tracking-[-0.01rem] text-main-text">
                  Sign up for Ruh Care
                </h1>

                <h3 className="mx-0 mb-6 mt-0 border-0 p-0 text-center align-baseline font-medium leading-8 tracking-[-0.01rem] text-main-text">
                  Step 1. Register with Google or Microsoft
                </h3>

                <div className="flex w-full flex-col gap-4">
                  <a
                    href={googleAuthUrl}
                    className="mx-auto flex w-full max-w-xs items-center justify-center gap-1 rounded-lg border border-divider bg-sidebar py-3 text-sidebar-text transition-[border,background-color,color,opacity] duration-300 hover:border-divider-hover hover:bg-sidebar-hover hover:text-sidebar-text-hover"
                  >
                    <div className="rounded-full bg-white p-2">
                      <svg className="w-4" viewBox="0 0 533.5 544.3">
                        <path
                          d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
                          fill="#4285f4"
                        />
                        <path
                          d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
                          fill="#34a853"
                        />
                        <path
                          d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z"
                          fill="#fbbc04"
                        />
                        <path
                          d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z"
                          fill="#ea4335"
                        />
                      </svg>
                    </div>
                    <span className="ml-4">Sign up with Google</span>
                  </a>
                </div>
              </div>
            )}

            {/* Step 2: Permission and Timezone Selection */}
            {currentSession && (
              <div className="mt-4 w-full flex flex-col gap-5 items-center">
                <h4 className="text-xl font-medium leading-8 tracking-tight text-center text-main-text mb-5">
                  Complete your profile
                </h4>

                <BaseInput
                  label="Phone Number"
                  description="Enter your phone number for account verification."
                  type="tel"
                  value={signupData.phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter your phone number"
                  required
                />

                <div className="flex flex-col gap-1">
                  <div className="block text-sm font-medium text-gray-300 mb-1">
                    Permission
                  </div>
                  <PermissionDropPicker
                    permissionId={signupData.permissionId}
                    onPermissionIdChange={handlePermissionChange}
                    widthClass="w-[300px]"
                    customPlaceholder="Select Permission..."
                  >
                    {({ open }) => (
                      <BaseButton
                        variant="transparent"
                        className="min-h-[2.5rem] max-h-[3rem] rounded-md bg-dark-800 border border-black p-2 text-left text-main-text flex items-center justify-between overflow-hidden w-[300px]"
                      >
                        <span className="truncate flex-1">
                          {signupData.permissionId
                            ? signupData.permissionId === "CLIENT"
                              ? "Client"
                              : "Doctor"
                            : "Select Permission..."}
                        </span>
                        <ChevronDownIcon
                          className={`size-4 flex-shrink-0 ml-2 transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </BaseButton>
                    )}
                  </PermissionDropPicker>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="block text-sm font-medium text-gray-300 mb-1">
                    Timezone
                  </div>
                  <TimeZoneDropPicker
                    timeZoneId={signupData.timeZone}
                    onTimeZoneIdChange={handleTimeZoneChange}
                    widthClass="w-[300px]"
                    customPlaceholder="Select Time zone..."
                  >
                    {({ open }) => (
                      <BaseButton
                        variant="transparent"
                        className="min-h-[2.5rem] max-h-[3rem] rounded-md bg-dark-800 border border-black p-2 text-left text-main-text flex items-center justify-between overflow-hidden w-[300px]"
                      >
                        <span className="truncate flex-1">
                          {formattedTimeZone}
                        </span>
                        <ChevronDownIcon
                          className={`size-4 flex-shrink-0 ml-2 transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </BaseButton>
                    )}
                  </TimeZoneDropPicker>
                </div>

                <BaseButton
                  variant="primary"
                  size="lg"
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !signupData.permissionId ||
                    !signupData.phone.trim()
                  }
                  className="mt-10 w-[240px] h-[50px] text-md font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <span>Please wait...</span>
                      <svg
                        className="h-5 w-5 animate-spin ml-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    <span>Complete Signup</span>
                  )}
                </BaseButton>

                {submitError && (
                  <div className="mt-4 text-center text-sm text-red-500">
                    {submitError}
                  </div>
                )}
              </div>
            )}

            <div className="mt-12 w-40 border-b border-divider"></div>

            {/* Terms and sign in link */}
            <div className="mb-20 mt-6 flex w-full max-w-xs flex-col gap-2 text-center text-main-text">
              <p className="mt-6 text-center text-xs">
                I agree to abide by Ruh Care's{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="border-b border-dotted border-gray-500"
                >
                  Terms of Service
                </a>{" "}
                and its{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="border-b border-dotted border-gray-500"
                >
                  Privacy Policy
                </a>
              </p>

              <p className="text-center text-xs">
                Have an account?{" "}
                <Link
                  to="/signin"
                  className="font-bold text-main-text hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="hidden flex-1 bg-[url(/signin/laptop-with-success-co.jpg)] bg-cover bg-center text-center lg:flex"></div>
      </div>
    </div>
  );
}
