"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");

  const [orderNo, setOrderNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [constructionName, setConstructionName] = useState("");
  const [orderDetail, setOrderDetail] = useState("");

  function handlePdfChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setPdfFile(file);

    const url = URL.createObjectURL(file);
    setPdfUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log({
      orderNo,
      customerName,
      deliveryDate,
      deliveryPlace,
      constructionName,
      orderDetail,
      pdfFile,
    });

    // TODO: Supabase保存

    router.push("/orders");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center">
          <h1 className="text-xl font-semibold text-slate-800">
            📋 製造指示書管理システム
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 mb-6"
        >
          ← 一覧へ戻る
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          製造指示書登録
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            {/* PDFエリア */}
            <div className="bg-white border rounded-xl p-4">
              <label className="block font-medium mb-3">
                製造指示書PDF
              </label>

              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
                className="mb-4"
              />

              <div className="h-[700px] border rounded-lg overflow-hidden bg-slate-100">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    PDFを選択してください
                  </div>
                )}
              </div>
            </div>

            {/* 入力エリア */}
            <div className="bg-white border rounded-xl p-6">
              <div className="space-y-5">
                <div>
                  <label className="block mb-2 font-medium">
                    案件No.
                  </label>

                  <input
                    type="text"
                    value={orderNo}
                    onChange={(e) =>
                      setOrderNo(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    顧客名
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    納期
                  </label>

                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) =>
                      setDeliveryDate(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    納入先
                  </label>

                  <input
                    type="text"
                    value={deliveryPlace}
                    onChange={(e) =>
                      setDeliveryPlace(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    工事名
                  </label>

                  <input
                    type="text"
                    value={constructionName}
                    onChange={(e) =>
                      setConstructionName(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    受注内容
                  </label>

                  <textarea
                    rows={8}
                    value={orderDetail}
                    onChange={(e) =>
                      setOrderDetail(e.target.value)
                    }
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/orders")}
                    className="px-5 py-3 border rounded-lg"
                  >
                    キャンセル
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                  >
                    登録
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}