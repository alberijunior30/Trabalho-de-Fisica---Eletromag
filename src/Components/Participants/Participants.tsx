type Props = {
  participants?: string[];
};

export function Participants({participants}:Props){
    if (participants === undefined){
        return(
            <h1>
                Nao existe Participantes
            </h1>
        )
    }
    return (
      <div>
        <h1 className="text-lg font-serif mb-3 text-gray-800">
          PARTICIPANTES:
        </h1>
        <ul className="list-disc pl-5 space-y-1 marker:text-emerald-700">
          {participants.map((participant, index) => (
            <li key={index} className="text-sm text-gray-700">
              {participant}
            </li>
          ))}
        </ul>
      </div>
    );
}