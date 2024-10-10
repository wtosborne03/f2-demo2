
import gsap from "gsap";
import { sendMessage } from "$lib";

function playerEmote(event: Event) {
    if (event.target !== event.currentTarget) {
        return;
    }
    gsap.to('body', {
        scale: 0.9,
        duration: 0.2,
    });
    gsap.to('body', {
        scale: 1,
        delay: 0.2,
        duration: 0.2,
    });

    sendMessage({
        type: "game",
        data: {
            type: "emote",
        },
    });

}
export { playerEmote };