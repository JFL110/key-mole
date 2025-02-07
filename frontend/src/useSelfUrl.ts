const useSelfUrl = () => {
    return {
        href: `${window.location.protocol}//${window.location.host}`,
        withoutProtocol: `${window.location.host}`
    }
}

export default useSelfUrl