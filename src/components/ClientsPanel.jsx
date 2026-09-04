export default function ClientsPanel({
  clientes,
  onOpenClient,
  onClose
}) {

  return (

    <div
      className="panel-overlay"
      onMouseDown={(e)=>{

        if(e.target === e.currentTarget){
          onClose()
        }

      }}
    >

      <div className="panel">


        <div className="panel-head">

          <h2 className="serif">
            👥 Clientes
          </h2>


          <button
            className="icon-btn"
            onClick={onClose}
          >
            ✕
          </button>

        </div>



        {clientes.map((cliente)=>(

          <button
            key={cliente.id}
            className="panel-item"
            onClick={() =>
              onOpenClient(cliente)
            }
          >

            <strong>
              {cliente.nombre}
            </strong>


            <span>
              {cliente.telefono || ''}
            </span>


          </button>

        ))}


      </div>

    </div>

  )

}
