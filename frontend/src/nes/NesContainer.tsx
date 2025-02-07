interface NesContainerProps {
    title: string
    cls?: string
    children: React.ReactNode
}

const NesContainer = ({ title, cls, children }: NesContainerProps) => (
    <section className={`nes-container with-title ${cls}`}>
        <h3 className="title">{title}</h3>
        {children}
    </section>)

export default NesContainer