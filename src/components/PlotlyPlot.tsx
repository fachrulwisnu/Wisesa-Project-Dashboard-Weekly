import { useEffect, useRef, useState, CSSProperties } from "react";

interface PlotlyPlotProps {
  data: any[];
  layout: any;
  config?: any;
  className?: string;
  style?: CSSProperties;
}

export default function PlotlyPlot({
  data,
  layout,
  config = { responsive: true, displayModeBar: false },
  className = "w-full h-full",
  style,
}: PlotlyPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<any>(null);
  const [isPlotlyReady, setIsPlotlyReady] = useState(false);

  // Check for window.Plotly and wait if not fully loaded yet
  useEffect(() => {
    let active = true;
    const checkPlotly = () => {
      if ((window as any).Plotly) {
        if (active) setIsPlotlyReady(true);
      } else {
        setTimeout(checkPlotly, 100);
      }
    };
    checkPlotly();
    return () => {
      active = false;
    };
  }, []);

  // Set up Plotly plot and redraw on data/layout change
  useEffect(() => {
    if (!isPlotlyReady || !containerRef.current) return;

    const Plotly = (window as any).Plotly;
    if (!Plotly) return;

    // Deep merge layout for transparent bg and Poppins Font
    const fullLayout = {
      ...layout,
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: {
        family: "Poppins, sans-serif",
        ...layout?.font,
      },
      margin: {
        t: 40,
        r: 20,
        b: 40,
        l: 50,
        ...layout?.margin,
      },
    };

    // Build/Rebuild the plot
    Plotly.newPlot(containerRef.current, data, fullLayout, config)
      .then((gd: any) => {
        plotRef.current = gd;
      })
      .catch((err: any) => {
        console.error("Plotly render error: ", err);
      });

    return () => {
      // Cleanup of PLotly is good practice, but Plotly.purge is recommended
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [isPlotlyReady, data, layout, config]);

  // Handle Container resizing using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const Plotly = (window as any).Plotly;
    const observer = new ResizeObserver((entries) => {
      if (!plotRef.current || !Plotly) return;
      
      // Debounced or direct resize call
      window.requestAnimationFrame(() => {
        if (containerRef.current && (window as any).Plotly) {
          try {
            Plotly.Plots.resize(containerRef.current);
          } catch (e) {
            // Silence resize errors for unmounted elements
          }
        }
      });
    });

    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [isPlotlyReady]);

  return (
    <div className="w-full h-full min-h-[300px] relative overflow-hidden">
      {!isPlotlyReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-xs text-gray-500 font-medium">Loading Plotly...</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={className}
        style={style}
      />
    </div>
  );
}
