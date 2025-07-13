
export function meta() {
  return [
    { title: "Sign in | Ruh Care" },
    { name: "description", content: "Sign in for Ruh care" },
  ];
}

export default function SignIn() {
  // --- State (equivalent to Vue's ref) ---
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  
  // --- Handlers ---
  const handleGoogleSignIn = (e: React.MouseEvent) => {
    if (isLoadingGoogle) {
      e.preventDefault();
      return;
    }
    setIsLoadingGoogle(true);
  };

  return (
    <div className="flex min-h-screen w-full justify-center bg-main text-gray-900">
      <div className="m-0 flex max-w-screen-xl flex-1 justify-center overflow-hidden bg-sidebar shadow sm:m-10 sm:rounded-lg">
        {/* Left panel with fixed logo and scrollable content */}
        <div className="flex flex-col p-6 sm:p-12 lg:w-1/2 xl:w-5/12">
          {/* Fixed logo section */}
          <div>
            <img 
              src="https://cdn.prod.website-files.com/64bfe68d3f479572876205b2/64cdca5e648369d914c4ac00_Ruh%20Main%20Logo.png" 
              className="mx-auto w-60" 
              alt="Logo"
            />
          </div>
          
          {/* Scrollable content section */}
          <div className="overflow-y-auto">
            <div className="mt-12 flex flex-col items-center">
              <h1 className="mx-0 mb-6 mt-0 animate-[0.5s_cubic-bezier(.25,0.46,0.45,0.94)_0.2s_both_fXDJYJ] border-0 p-0 text-center align-baseline text-2xl font-medium leading-8 tracking-[-0.01rem] text-main-text">
                Sign in for Success
              </h1>

              <div className="mt-8 flex w-full flex-col gap-4">
                <div className="flex w-full flex-col gap-4">
                  {/* Google */}
                  <a
                    href="/auth/login/federated/google"
                    onClick={handleGoogleSignIn}
                    className={`mx-auto flex w-full max-w-xs items-center justify-center gap-4 rounded-lg border border-divider bg-sidebar px-4 py-3 text-sidebar-text transition-[border,background-color,color,opacity,transform] duration-300 hover:border-divider-hover hover:bg-sidebar-hover hover:text-sidebar-text-hover ${
                      isLoadingGoogle ? 'button-press border-divider-hover bg-sidebar-hover text-sidebar-text-hover' : ''
                    }`}
                  >
                    <div className="relative flex size-8 items-center justify-center rounded-full bg-white">
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
                      {isLoadingGoogle && <div className="spinner" />}
                    </div>
                    <span className="grow">Sign in with Google</span>
                  </a>
                </div>
              </div>

              <div className="mt-12 w-40 border-b border-divider" />

              <div className="mt-8 flex w-full flex-col gap-2 text-center text-main-text">
                <p className="text-center">
                  Don't have an account?
                  <br />
                  <a href="/signup" className="font-bold text-main-text hover:underline">
                    Sign up
                  </a>
                  {' or '}
                  <a
                    href="https://www.wiseboxs.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:underline"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hidden flex-1 bg-[url(/signin/laptop-with.jpg)] bg-cover bg-center text-center lg:flex" />
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .button-press {
            transform: scale(0.98);
            transition: transform 0.1s ease-in-out;
          }

          .spinner {
            width: 32px;
            height: 32px;
            border: 2px solid rgba(255, 165, 0, 0.9);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
            position: absolute;
            left: 0;
            top: 0;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `
      }} />
    </div>
  );
}
