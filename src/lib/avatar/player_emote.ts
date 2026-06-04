import { gameClient } from "$lib/wsapi/gameClient";

/**
 * Send an emote to the host to animate the player's selfie avatar.
 * Triggers a brief "happy" expression + bounce on the 3D avatar.
 */
export function playerEmote() {
  gameClient.sendInput({
    type: "emote",
  });
}
