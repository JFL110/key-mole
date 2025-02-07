import classNames from "classnames"
import useGame from "./useGame"
import { useEffect } from "react"
import delay from "./delay"

const Rumbler = (
    { children, id, cls }: { children: React.ReactNode, id: string, cls?: string }
) => {
    const rumble = useGame().rumble
    const isActive = rumble.isActive(id)

    useEffect(() => {
        if (isActive) {
            delay(500).then(() => rumble.deactivate(id))
        }
    }, [isActive])

    return <div
        className={classNames('rumbler', isActive && 'rumble', cls)}
    >
        {children}
    </div>
}

export default Rumbler