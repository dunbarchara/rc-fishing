export default function DrawingPreview({ src }: { src: string }) {
  return (
    <div className="my-6 p-4 border rounded bg-gray-50 text-center">
      <h3 className="font-semibold text-gray-800 mb-2">
        Saved Drawing (Fetched from SQLite Backend):
      </h3>
      <img
        src={src}
        alt="Saved user drawing"
        className="w-48 h-48 mx-auto border rounded bg-white shadow-sm object-contain"
      />
    </div>
  );
}
