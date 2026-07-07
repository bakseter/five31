import { useGetLiftsQuery, useGetMeQuery } from './api';
import SetupForm from './components/SetupForm';
import CycleView from './components/CycleView';
import AdvancePanel from './components/AdvancePanel';
import History from './components/History';

export default function App() {
  const { data: lifts, isLoading, isError } = useGetLiftsQuery();
  const { data: me } = useGetMeQuery();

  const cycleNumber = lifts?.[0]?.cycleNumber ?? 1;
  const started = lifts?.some((l) => l.trainingMax > 0) ?? false;

  return (
    <div className="page">
      <header className="masthead">
        <span className="mark">5·3·1</span>
        <div className="masthead-text">
          <h1>Cycle Builder</h1>
          <p className="sub">
            Set your training maxes. The first four-week wave calculates itself.
          </p>
        </div>
        <div className="masthead-meta">
          {started && <span className="cycle-badge">Cycle {cycleNumber}</span>}
          {me && me.subject !== 'default' && (
            <>
              <span className="user-chip" title={me.subject}>
                {me.name || me.subject}
              </span>
              {/* Envoy Gateway intercepts /logout and clears the OIDC session. */}
              <a className="signout" href="/logout">
                Sign out
              </a>
            </>
          )}
        </div>
      </header>

      {isLoading && <p className="note">Loading&hellip;</p>}
      {isError && (
        <p className="note error">
          Can&rsquo;t reach the server. Is the backend running?
        </p>
      )}

      {lifts && (
        <>
          <SetupForm lifts={lifts} />
          {/* Keyed on the cycle so logged-rep inputs reset when a cycle advances. */}
          <CycleView key={cycleNumber} lifts={lifts} />
          <AdvancePanel lifts={lifts} />
          <History />
        </>
      )}
    </div>
  );
}
