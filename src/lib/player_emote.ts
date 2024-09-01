
import gsap from "gsap";
import { sendMessage } from "$lib";

function playerEmote() {
    gsap.fromTo(
        "body",
        {
            backgroundColor: "rgb(36, 44, 70)",
        },
        {
            duration: 0.15,
            backgroundColor: "rgb(48, 78, 79)",
            repeat: 1,
            yoyo: true,
            ease: "power1.inOut",
        },
    );
    sendMessage({
        type: "game",
        data: {
            type: "playerEmote",
        },
    });

}
export { playerEmote };