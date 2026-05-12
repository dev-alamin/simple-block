export default function Edit({ context }) {
    const style = {
        backgroundColor: context['sblock/cardBackground'],
        color: context['sblock/headingColor'],
        padding: '20px',
        borderRadius: '8px'
    };

    return (
        <div style={style}>
            <h4 style={{ color: context['sblock/headingColor'] }}>
                Project Title Placeholder
            </h4>
        </div>
    );
}