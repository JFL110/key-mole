import NesContainer from "./nes/NesContainer"

const Instructions = () => (
    <NesContainer title="Gameplay">
        <span>You'll need at least two players. Players take turns being the mole by pressing a key. The other players are whackers and need to press the mole's key as quickly as they can.</span>
        <br />
        <br />
        <span>After some keys have been whacked, the players swap.</span>
        <br />
        <br />
        <span>Points are awarded to the mole for the time their keys are un-whacked and deducted for mis-presses.</span>
    </NesContainer>
)

export default Instructions