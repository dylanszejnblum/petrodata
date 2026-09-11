import { Card, CardHead, CardPie, Seccion } from '../_ui/kit'
import { ListaPersonas } from '../_ui/ListaPersonas'
import { CabeceraVotos } from '../_ui/CabeceraVotos'
import { EstadoVoto } from '../_ui/EstadoVoto'
import { PATH } from '../_ui/iconos'
import { LIMITE, VOTANTES_SEMANA, VOTOS_SEMANA } from '../_ui/voto-reglas'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { aFila, PERSONAS } from '@/fixtures/personas'

/* DIRECTIVOS — quién dirige la cuenca, ordenado por un índice.

   La sección sale de CEOS/, el pipeline que busca y confirma al CEO actual de
   las 50 primeras empresas del sitio. Cruzan 48 con el ranking de COMPANIES.

   LA DECISIÓN DE FONDO, y conviene que esté escrita porque condiciona todo lo
   demás: no hay ninguna métrica de la PERSONA en el dato. El pipeline trae
   nombre, cargo y fuente. Así que el índice es de la EMPRESA, atribuido a quien
   la dirige, y la página lo dice en el pie de la card. Cualquier otra lectura
   sería inventarle a una persona real un número que nadie midió.

   LA PONDERACIÓN NO SE PUBLICA (pedido de Mariano, 2026-09-01). El pie nombra
   los tres insumos y nada más. Que eso sea cierto no depende de la prosa sino
   de qué se serializa: ver `PersonaFila` en fixtures/personas.ts.

   LA CARD 01 —la que explicaba el índice y mostraba el presupuesto de votos—
   ESTÁ SACADA (pedido de Mariano, 2026-09-01: «por ahora saquemos esta card,
   dejemos solo la lista»). PanelVoto.tsx y su CSS quedan en el repo sin
   importar desde ningún lado, porque «por ahora» no es «nunca» y volver a
   colgarlo es una línea.

   Lo que se pierde con la card y hay que tener presente: el contador de votos
   restantes ya no se ve en ninguna parte. La mecánica sigue funcionando —los
   chevrones se deshabilitan solos al quinto voto y el title dice por qué— pero
   el que llega al límite se entera recién cuando un botón deja de responder.
   La regla queda dicha en la nota de la cabecera, que es estática.

   Dos cosas que quedan pendientes de decisión y no de código:

   · LAS CARAS ESTÁN GENERADAS CON IA. Salen de CEOS/data/headshots/, que las
     produce con Higgsfield desde una foto real y el prompt «Recreate this exact
     person as a professional corporate executive cover portrait». Son
     fotorrealistas, sin marca de agua, de personas con nombre y apellido. Están
     en public/images/ceos/ para poder ver la maqueta y NO se versionan —hay un
     .gitignore ahí que explica por qué—. La lista cae al monograma sola si el
     archivo no está, así que publicar sin resolver la foto ya funciona.

   · EL VOTO ES UNA MAQUETA. El enunciado es «uno por semana por IP» y eso vive
     en el servidor; acá se guarda en localStorage para poder ver la
     interacción. Además una IP no es una persona: una oficina o una operadora
     móvil son miles detrás de una sola, y cualquiera con VPN vota lo que
     quiera. Está dicho al pie. */

export default function V2Directivos() {
  /* Se proyecta ACÁ, del lado del servidor. Ver PersonaFila: pasar `Persona`
     entero publicaría los tres componentes del índice en el HTML y con eso los
     pesos se despejan.

     QUIÉN TIENE CARA SE RESUELVE ACÁ Y NO EN EL NAVEGADOR. Dieciséis de las
     cuarenta y ocho no tienen foto, y hasta ahora la fila igual pedía el
     archivo y caía al monograma con el `onError` de la imagen. Eso fallaba de
     dos maneras distintas:

     · en producción el 404 puede llegar ANTES de que React hidrate, y ahí el
       manejador todavía no existe: el evento se dispara contra nadie y queda
       el ícono de imagen rota;
     · en desarrollo es peor, porque Next responde los estáticos que faltan con
       200 y la página de error en HTML —35 KB—, así que no hay error que
       atrapar: la imagen queda cargando para siempre.

     El servidor ya sabe qué archivos hay. Preguntándole al disco acá, la fila
     que no tiene cara no pide nada y renderiza el monograma de una: no hay
     404, no hay parpadeo y no hay dieciséis pedidos al pedo. */
  const filas = PERSONAS.map((p) =>
    aFila(p, existsSync(join(process.cwd(), 'public/images/ceos', `${p.slug}.jpg`))),
  )

  return (
    <>
      <Seccion
        n="01"
        titulo="Directivos"
        desc="Las 48 personas que hacen crecer la producción de energía del país."
      >
        <Card>
          <CardHead
            titulo="El ranking"
            /* `lista`: tres líneas que decrecen. Es la forma de una tabla de
               posiciones y se entiende sin leyenda. `ordenar` parecía el
               candidato pero su geometría termina en un «+» —es el control de
               agregar un criterio de orden— y acá no hay nada que agregar.
               Los dos estaban en el catálogo sin usar, así que ninguno le pisa
               el significado a otro ícono de la web. */
            icono={PATH.lista}
            /* Las cifras cuelgan del rótulo y los chips ocupan la nota
               (pedido de Mariano, 2026-09-02). El rótulo dice qué es la card y
               el renglón de abajo dice de qué tamaño: «El ranking» y, debajo,
               cuánta gente lo votó. Los dos chips son estado —el presupuesto
               de quien mira y el reloj del corte— y cierran contra el borde
               derecho, que es donde el sistema pone lo que no se lee de
               corrido. */
            sub={<CabeceraVotos votos={VOTOS_SEMANA} personas={VOTANTES_SEMANA} />}
            /* Los dos números salen de VOTANTES_SEMANA y VOTOS_SEMANA, que
               están escritos a mano. Leé el comentario de voto-reglas.ts antes
               de citarlos en cualquier lado que no sea esta pantalla. */
            nota={<EstadoVoto />}
          />
          <ListaPersonas personas={filas} />
          <CardPie>
            {/* La ponderación NO se publica (pedido de Mariano, 2026-09-01: «el
                algo del ranking tiene que ser secreto, se puede explicar por
                arriba que es lo que se tiene en cuenta»). Acá van los tres
                insumos por su nombre y nada más: ni los pesos ni cómo se
                combinan.

                Queda una sola frase de las que había en los pies, y es la que
                no conviene perder: que el número es de la EMPRESA. Es un
                ranking de personas con nombre y apellido calculado con cifras
                que no son de ellas, y decirlo cuesta un renglón. */}
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              <b className="font-semibold">Puntos</b> combina lo que maneja cada uno —cuánto
              produce su empresa, cuánto saca por pozo, cuánto vale lo que produce— con los
              votos. El orden se recalcula una vez por día: tu voto de hoy entra en el próximo
              corte, y la flecha al lado del puesto dice cuántos lugares se movió cada uno.
            </span>
          </CardPie>
        </Card>
      </Seccion>
    </>
  )
}
