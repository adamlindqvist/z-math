import { gameStore, useGameState } from "../store/gameStore";
import { Modal, CornerAction } from "./Dialogue";
export function PictureClue() {
  if (useGameState().overlay !== "pictureClue") return null;
  return <Modal label="Märkena hör ihop" action={<CornerAction onActivate={() => gameStore.close()}><span data-read-aloud>Spela vidare</span></CornerAction>}>
    <h2>Märkena hör ihop.</h2>
    <svg viewBox="0 0 480 250" role="img" aria-label="En sköld, en tom rustning och ett kungaporträtt med samma kronmärke, förbundna med en tom tron" className="mx-auto my-4 w-full max-w-[440px]">
      <defs><g id="clue-seal"><circle r="16" fill="#efd077" stroke="#a87b43" strokeWidth="2"/><path d="M-10 6L-11-7L-4-2L0-11L4-2L11-7L10 6Z" fill="#94364c"/></g></defs>
      <path d="M45 20H105V65Q75 100 45 65Z" fill="#96364c" stroke="#e5bf66" strokeWidth="5"/>
      <path d="M206 85V42L220 28H250L265 42V85Z" fill="#94a1af"/><path d="M217 29V17Q235 0 252 17V29Z" fill="#758697"/><path d="M225 23H244" stroke="#3c424c" strokeWidth="5"/>
      <rect x="358" y="8" width="70" height="84" rx="3" fill="#4e607b" stroke="#e5bf66" strokeWidth="7"/><circle cx="393" cy="35" r="13" fill="#ebbd95"/><path d="M367 83Q367 50 393 50Q418 50 418 83" fill="#96364c"/>
      <use href="#clue-seal" x="75" y="49"/><use href="#clue-seal" x="235" y="59"/><use href="#clue-seal" x="393" y="69"/>
      <path d="M75 104Q75 137 209 145M235 99V145M393 111Q393 137 264 145" stroke="#c7a866" strokeWidth="4" fill="none" strokeDasharray="6 7"/>
      <path d="M210 214V158Q235 138 260 158V214M200 184V229M270 184V229M200 205H270" stroke="#d5ad55" strokeWidth="11" fill="#96364c"/>
      <use href="#clue-seal" x="235" y="176"/>
    </svg>
  </Modal>;
}
