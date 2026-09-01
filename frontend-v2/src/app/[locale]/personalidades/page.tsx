import { Card, CardHead, CardPie, FLUIDO, PALETA_TAGS, Pie, Seccion } from '../_ui/kit'
import { ListaPersonas } from '../_ui/ListaPersonas'
import { PanelVoto } from '../_ui/PanelVoto'
import { LIMITE } from '../_ui/votos'
import { PERSONAS, PESOS, PISO_POZOS } from '@/fixtures/personas'
import { getTranslations } from 'next-intl/server'
import { formatDecimal, formatInteger } from '@/lib/format'

/* PERSONALIDADES — quién dirige la cuenca, ordenado por un índice.

   La sección sale de CEOS/, el pipeline que busca y confirma al CEO actual de
   las 50 primeras empresas del sitio. Cruzan 48 con el ranking de COMPANIES.

   LA DECISIÓN DE FONDO, y conviene que esté escrita porque condiciona todo lo
   demás: no hay ninguna métrica de la PERSONA en el dato. El pipeline trae
   nombre, cargo y fuente. Así que el índice es de la EMPRESA, atribuido a quien
   la dirige, y la página lo dice en la bajada y en el pie. Cualquier otra
   lectura sería inventarle a una persona real un número que nadie midió.

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

export default async function V2Personalidades({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'v2.personalidades' })
  const total = PERSONAS.length
  const confirmados = PERSONAS.filter((p) => p.confirmado).length
  const cobertura = PERSONAS.reduce((s, p) => s + p.pctValor, 0)

  return (
    <>
      {/* La 01 explica QUÉ es esto (pedido de Mariano, 2026-08-31). Antes eran
          tres cifras —personas, cobertura, cargos confirmados— y estaban mal
          puestas: son metadata del dataset, no una explicación. Un ranking de
          personas con nombre y apellido tiene que decir de entrada qué mide,
          quién lo calcula y qué puede hacer el que lo lee, o el que se busca a
          sí mismo no sabe si el número es una opinión o un dato.

          Las tres cifras no se tiran: bajan al pie, que es donde va lo que
          califica a la sección. */}
      <Seccion
        n="01"
        titulo={t('s01t')}
        desc={t('s01d')}
      >
        <Card>
          <CardHead titulo={t('cardIndice')} nota={`${total} personas`} />
          <div className="s-clave">
            <i style={{ background: FLUIDO.petroleo }} aria-hidden />
            <span className="s-cuerpo min-w-0 flex-1">
              <b className="font-semibold">Ordena a quienes están al frente</b> de las empresas
              que producen el país. Las {total} que figuran acá dirigen compañías que suman el{' '}
              {formatDecimal(cobertura, 1)}% del valor de la producción nacional.
            </span>
          </div>
          <div className="s-clave">
            <i style={{ background: FLUIDO.gas }} aria-hidden />
            <span className="s-cuerpo min-w-0 flex-1">
              <b className="font-semibold">El algoritmo es propio.</b> Combina la escala de la
              empresa, el rendimiento que saca por pozo que opera y la prima de valor que captura
              por encima de su volumen. Los insumos son públicos; la ponderación, nuestra.
            </span>
          </div>
          <div className="s-clave">
            <i style={{ background: PALETA_TAGS[2] }} aria-hidden />
            <span className="s-cuerpo min-w-0 flex-1">
              <b className="font-semibold">La votación semanal pesa.</b> Cada lunes el conteo
              vuelve a cero y lo que vota la gente entra en el índice de esa semana. Tenés{' '}
              <b className="font-semibold">{LIMITE} votos</b> por semana: alcanzan para elegir, no
              para empujar.
            </span>
          </div>
          {/* El presupuesto y la actividad, adentro de la misma card que
              explica la mecánica (pedido de Mariano). Es donde tienen sentido:
              debajo de la frase que dice que el voto pesa. */}
          <PanelVoto total={total} />
          <CardPie>
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              {/* El pie dice las dos cosas que el lector necesita para saber
                  cuánto creerle a la fila donde aparece su nombre. */}
              El índice mide a la <b className="font-semibold">empresa</b> y se atribuye a quien la
              dirige: en el dato no hay ninguna métrica de la persona.{' '}
              <b className="font-semibold">{confirmados}</b> de {total} tienen el cargo verificado
              contra más de una fuente; el resto va marcado como sin confirmar.
            </span>
          </CardPie>
        </Card>
        {/* El chip «simulado» salió de la card (pedido de Mariano) y la
            aclaración baja acá, que es donde el sistema pone lo que califica a
            la sección entera. Conviene tenerlo presente: si este pie se
            recorta, los dos números de actividad pasan a leerse como ciertos. */}
        <Pie>
          La actividad de la semana —cuántos votos van, cuánta gente votó y quiénes son los
          más votados— está <b className="font-semibold">simulada</b>: sólo puede darla el
          servidor. Tu
          presupuesto de {LIMITE} votos sí es real y sale de este navegador. El voto{' '}
          <b className="font-semibold">no se edita</b>: una vez emitido queda hasta el lunes.
        </Pie>
      </Seccion>

      <Seccion
        n="02"
        titulo={t('s02t')}
        desc={t('s02d')}
      >
        <Card>
          <CardHead titulo={t('cardRanking')} nota="tu voto se renueva cada lunes" />
          <ListaPersonas personas={PERSONAS} />
          <CardPie>
            {/* Las tres barritas no llevan leyenda de color porque no tienen
                color: son tres, siempre en el mismo orden, y el pie las nombra.
                Una leyenda con tres puntos grises no distinguiría nada. */}
            <span className="s-micro" style={{ color: 'var(--ink-2)' }}>
              Las tres barras de cada fila son los componentes del índice, en orden:{' '}
              <b className="font-semibold">escala</b> ({formatDecimal(PESOS.escala * 100, 0)}%),{' '}
              <b className="font-semibold">rendimiento</b> ({formatDecimal(PESOS.rinde * 100, 0)}%) y{' '}
              <b className="font-semibold">prima</b> ({formatDecimal(PESOS.prima * 100, 0)}%).
            </span>
          </CardPie>
        </Card>
        <Pie>
          <b className="font-semibold">Escala</b> es el porcentaje del valor de la producción del
          país que aporta su empresa; <b className="font-semibold">rendimiento</b>, cuánto valor
          saca por pozo que opera; <b className="font-semibold">prima</b>, cuánto más valor captura
          del que le tocaría por volumen. Los tres salen de datos públicos y se normalizan de 0 a
          100. El rendimiento se divide por los pozos más un piso de{' '}
          {formatInteger(PISO_POZOS)}: sin ese piso una empresa de nueve pozos entraba séptima con
          el 0,1% del valor, que es el artefacto del denominador chico.
        </Pie>
        <Pie>
          El índice <b className="font-semibold">empata</b> abajo: dieciséis personas comparten
          el 7,3 porque sus empresas aportan el 0,1% del valor y ninguno de los tres componentes
          las separa. Los empatados llevan un «=» y comparten puesto, como en cualquier tabla de
          posiciones — numerarlos 30, 31, 32 afirmaría un orden que el dato no tiene.
        </Pie>
        <Pie>
          El índice mide a la <b className="font-semibold">empresa</b> y se atribuye a quien la
          dirige: en el dato no hay ninguna métrica de la persona. El voto de esta maqueta se
          guarda en tu navegador — en producción va del lado del servidor, y conviene saber que
          una IP no es una persona: una oficina o una operadora móvil son miles detrás de una
          sola, y cualquiera con VPN vota las veces que quiera.
        </Pie>
      </Seccion>
    </>
  )
}
