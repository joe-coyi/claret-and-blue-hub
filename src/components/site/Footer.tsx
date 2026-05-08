export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 justify-between">
        <p>© {new Date().getFullYear()} Claret &amp; Co. — A fan-built hub. Not affiliated with West Ham United FC.</p>
        <p className="font-display tracking-widest text-foreground/80">COME ON YOU IRONS</p>
      </div>
    </footer>
  );
}
