import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import { DEFAULT_DEBUGGER_HUB_URL, createDebugUrl } from "./debug";
import { currentURL } from "./utils";

type State = {
  frame: "intro" | "evaluate" | "error"
  active?: string;
  total_button_presses?: number;
  message?: string
};

const initialState: State = { frame: "intro" };

// const reducer: FrameReducer<State> = (state, action) => {
//   return {
//     total_button_presses: state.total_button_presses + 1,
//     active: action.postBody?.untrustedData.buttonIndex
//       ? String(action.postBody?.untrustedData.buttonIndex)
//       : "1",
//   };
// };

// This is a react server component only
export default async function Home({ searchParams }: NextServerPageProps) {
  const url = currentURL("/");
  const previousFrame = getPreviousFrame<State>(searchParams);
  const origin = url.origin
  const state: State = previousFrame.prevState || initialState

  try {
    const frameMessage = await getFrameMessage(previousFrame.postBody, {
      hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
    });

    if (frameMessage && !frameMessage?.isValid) {
      throw new Error("Invalid frame payload");
    }

    const requesterFollowsCaster = frameMessage?.requesterFollowsCaster
    const likedCast = frameMessage?.likedCast
    const recastedCast = frameMessage?.recastedCast

    const isValid = [
      requesterFollowsCaster,
      likedCast,
      recastedCast
    ].every(Boolean)

    const shareForm = state?.frame === "evaluate" && isValid

    // then, when done, return next frame
    return (
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={{
          frame: "evaluate"
        }}
        previousFrame={previousFrame}
      >
        {state.frame === "intro" ? <FrameImage src={origin + "/images/intro.png"} /> : null}

        {state.frame === "intro" ? <FrameButton>
          Tell me more
        </FrameButton> : null}

        {state.frame === "evaluate" && shareForm ?
          <FrameImage src={origin + '/images/success.png'} />
          : null}

        {state.frame === "evaluate" && shareForm ?
          <FrameButton action="link" target={`https://www.google.com`}>
            I want in
          </FrameButton> : null
        }

        {state.frame === "evaluate" && !shareForm ?
          <FrameImage src={origin + '/images/error.png'} />
          : null
        }

        {state.frame === "evaluate" && !shareForm ?
          <FrameButton action={"post"}>Retry</FrameButton> : null
        }

      </FrameContainer>
    );
  } catch (error) {
    console.error(error)
    return <FrameContainer
      postUrl="/frames"
      pathname="/"
      state={{
        frame: "evaluate",
      }}
      previousFrame={previousFrame}
    >
      <FrameImage src={origin + '/images/unexpected.png'} />
      <FrameButton>
        Retry
      </FrameButton>
    </FrameContainer>
  }
}
